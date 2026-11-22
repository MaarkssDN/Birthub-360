export type CommandRiskLevel = 'SAFE' | 'CAUTION' | 'DANGEROUS' | 'BLOCKED';

export interface CommandAnalysisResult {
  riskLevel: CommandRiskLevel;
  reason: string;
  isBlocked: boolean;
  requiresConfirmation?: boolean;
  matchedPattern?: string;
}

export interface TerminalAuditLogEntry {
  timestamp: string;
  commandSnippet: string;
  riskLevel: CommandRiskLevel;
  reason: string;
  action: 'ANALYZE' | 'BLOCKED' | 'FLAGGED';
}

export class TerminalSafetyService {
  private static auditLogs: TerminalAuditLogEntry[] = [];

  // Strictly blocked command names / binaries across Bash, PowerShell, and Windows CMD
  private static readonly BLOCKED_COMMANDS = new Set([
    'diskpart',
    'format-volume',
    'format',
    'format-disk',
    'clear-disk',
    'initialize-disk',
    'stop-computer',
    'restart-computer',
    'shutdown',
  ]);

  // Blocked arguments indicating recursive destructive deletion or exfiltration
  private static readonly DESTRUCTIVE_COMBINATIONS = [
    { cmd: /^(rm|remove-item)$/i, args: /(-rf|-fr|-r\s+-f|-recurse\s+-force|-recurse|-force)/i },
    { cmd: /^(del|erase)$/i, args: /(\/s|\/q|\/f)/i },
    { cmd: /^(rmdir|rd)$/i, args: /(\/s|\/q)/i },
    { cmd: /^(dd)$/i, args: /(of=\/dev\/[a-z0-9]+)/i },
    { cmd: /^(mkfs|mkfs\.[a-z0-9]+)$/i, args: /.*/i },
  ];

  // Credential exfiltration patterns
  private static readonly EXFILTRATION_TARGETS = [
    /\/etc\/shadow/i,
    /\/etc\/master\.passwd/i,
    /\.ssh\/(id_rsa|id_ecdsa|id_ed25519|authorized_keys)/i,
    /SAM\b/i,
    /SYSTEM\b/i,
    /credentials\.json/i,
    /\.aws\/credentials/i,
  ];

  // Execution policy bypass or privilege escalation
  private static readonly PRIVILEGE_OR_POLICY_BLOCKED = [
    /set-executionpolicy\s+(-executionpolicy\s+)?(unrestricted|bypass)/i,
    /powershell(\.exe)?\s+(-ep|-executionpolicy)\s+(bypass|unrestricted)/i,
    /:(){ :|:& };:/, // Fork bomb
  ];

  // Dangerous commands requiring explicit review/confirmation
  private static readonly DANGEROUS_COMMANDS = new Set([
    'mv',
    'move-item',
    'drop-database',
    'dropdb',
    'truncate',
    'fdisk',
    'parted',
    'iptables',
    'ufw',
  ]);

  // Sensitive caution commands
  private static readonly CAUTION_COMMANDS = new Set([
    'curl',
    'wget',
    'invoke-webrequest',
    'invoke-restmethod',
    'ssh',
    'scp',
    'rsync',
    'git',
    'npm',
    'yarn',
    'pnpm',
    'pip',
    'python',
    'python3',
    'node',
    'docker',
    'kubectl',
  ]);

  /**
   * Tokenizes and analyzes multi-command pipelines or command strings.
   */
  public static analyzeCommand(rawCommand: string): CommandAnalysisResult {
    if (!rawCommand || typeof rawCommand !== 'string') {
      return { riskLevel: 'SAFE', reason: 'Comando vazio.', isBlocked: false };
    }

    const command = rawCommand.trim();

    // 1. Direct prompt injection / destructive instruction checks
    const _lowerCmd = command.toLowerCase();

    // Fork bomb
    if (command.includes(':(){ :|:& };:')) {
      return TerminalSafetyService.recordAndReturn({
        riskLevel: 'BLOCKED',
        reason: 'Padrão de fork bomb detectado.',
        isBlocked: true,
        matchedPattern: 'fork-bomb',
        commandSnippet: command,
      });
    }

    // Privilege / policy bypass
    for (const pattern of TerminalSafetyService.PRIVILEGE_OR_POLICY_BLOCKED) {
      if (pattern.test(command)) {
        return TerminalSafetyService.recordAndReturn({
          riskLevel: 'BLOCKED',
          reason: 'Tentativa de bypass de política de execução ou escalada de privilégios.',
          isBlocked: true,
          matchedPattern: pattern.source,
          commandSnippet: command,
        });
      }
    }

    // Prompt injection heuristic: "please run rm -rf", "execute Remove-Item -Recurse", etc.
    if (
      /(please\s+(run|execute)|favor\s+executar|run\s+the\s+following|ignore\s+all\s+rules).*(rm\s+-rf|remove-item|format-volume|diskpart)/i.test(
        command,
      )
    ) {
      return TerminalSafetyService.recordAndReturn({
        riskLevel: 'BLOCKED',
        reason: 'Prompt injection solicitando comando destrutivo.',
        isBlocked: true,
        matchedPattern: 'prompt-injection-destructive',
        commandSnippet: command,
      });
    }

    // Credential exfiltration check
    for (const exfilTarget of TerminalSafetyService.EXFILTRATION_TARGETS) {
      if (exfilTarget.test(command)) {
        // Check if there is an inspection or extraction command
        if (
          /\b(cat|type|get-content|head|tail|more|less|curl|wget|scp|nc|ncat|netcat|invoke-webrequest)\b/i.test(
            command,
          )
        ) {
          return TerminalSafetyService.recordAndReturn({
            riskLevel: 'BLOCKED',
            reason: `Tentativa de exfiltração de credencial ou arquivo sensível (${exfilTarget.source}).`,
            isBlocked: true,
            matchedPattern: exfilTarget.source,
            commandSnippet: command,
          });
        }
      }
    }

    // Check chained commands split by ;, &&, ||, |, or newlines
    const statements = command
      .split(/(?:;|&&|\|\||\||\r?\n)/)
      .map((s) => s.trim())
      .filter(Boolean);

    let highestRisk: CommandRiskLevel = 'SAFE';
    let highestReason = 'Comando seguro validado na política de segurança.';
    let matchedPattern: string | undefined;

    for (const stmt of statements) {
      const tokens = stmt.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) continue;

      const baseCmd = (tokens[0].replace(/^(sudo|doas|nohup)\s+/i, '') || tokens[0]).toLowerCase();
      const restArgs = tokens.slice(1).join(' ').toLowerCase();

      // Check strictly blocked commands
      if (TerminalSafetyService.BLOCKED_COMMANDS.has(baseCmd)) {
        return TerminalSafetyService.recordAndReturn({
          riskLevel: 'BLOCKED',
          reason: `Comando destrutivo categoricamente bloqueado: ${baseCmd}`,
          isBlocked: true,
          matchedPattern: baseCmd,
          commandSnippet: command,
        });
      }

      // Check destructive combinations (e.g. rm -rf, Remove-Item -Recurse)
      for (const dest of TerminalSafetyService.DESTRUCTIVE_COMBINATIONS) {
        if (dest.cmd.test(baseCmd) && (dest.args.test(restArgs) || dest.args.test(stmt))) {
          return TerminalSafetyService.recordAndReturn({
            riskLevel: 'BLOCKED',
            reason: `Operação de deleção em massa destrutiva bloqueada: ${stmt}`,
            isBlocked: true,
            matchedPattern: `${dest.cmd.source} ${dest.args.source}`,
            commandSnippet: command,
          });
        }
      }

      // If statement includes "rm -rf" or "remove-item -recurse" anywhere
      if (/rm\s+-[a-z]*r[a-z]*f/i.test(stmt) || /remove-item\s+.*-recurse/i.test(stmt)) {
        return TerminalSafetyService.recordAndReturn({
          riskLevel: 'BLOCKED',
          reason: `Operação de deleção recursiva destrutiva bloqueada.`,
          isBlocked: true,
          matchedPattern: 'recursive-delete',
          commandSnippet: command,
        });
      }

      // Check dangerous commands
      if (TerminalSafetyService.DANGEROUS_COMMANDS.has(baseCmd)) {
        highestRisk = 'DANGEROUS';
        highestReason = `Comando com alto impacto estrutural detectado: ${baseCmd}. Requer confirmação explícita.`;
        matchedPattern = baseCmd;
      } else if (
        TerminalSafetyService.CAUTION_COMMANDS.has(baseCmd) &&
        highestRisk !== 'DANGEROUS'
      ) {
        highestRisk = 'CAUTION';
        highestReason = `Comando sensível de rede ou automação detectado: ${baseCmd}.`;
        matchedPattern = baseCmd;
      }
    }

    const isBlocked = highestRisk === 'DANGEROUS';
    return TerminalSafetyService.recordAndReturn({
      riskLevel: highestRisk,
      reason: highestReason,
      isBlocked,
      requiresConfirmation: highestRisk === 'CAUTION' || highestRisk === 'DANGEROUS',
      matchedPattern,
      commandSnippet: command,
    });
  }

  private static recordAndReturn(data: {
    riskLevel: CommandRiskLevel;
    reason: string;
    isBlocked: boolean;
    requiresConfirmation?: boolean;
    matchedPattern?: string;
    commandSnippet: string;
  }): CommandAnalysisResult {
    const entry: TerminalAuditLogEntry = {
      timestamp: new Date().toISOString(),
      commandSnippet: data.commandSnippet.slice(0, 150),
      riskLevel: data.riskLevel,
      reason: data.reason,
      action: data.isBlocked ? 'BLOCKED' : data.riskLevel === 'CAUTION' ? 'FLAGGED' : 'ANALYZE',
    };
    TerminalSafetyService.auditLogs.push(entry);
    if (TerminalSafetyService.auditLogs.length > 500) {
      TerminalSafetyService.auditLogs.shift();
    }

    return {
      riskLevel: data.riskLevel,
      reason: data.reason,
      isBlocked: data.isBlocked,
      requiresConfirmation: data.requiresConfirmation,
      matchedPattern: data.matchedPattern,
    };
  }

  /**
   * Retorna os últimos logs de auditoria de segurança de comandos.
   */
  public static getAuditLogs(): readonly TerminalAuditLogEntry[] {
    return TerminalSafetyService.auditLogs;
  }

  /**
   * Limpa os logs de auditoria (usado primariamente em testes).
   */
  public static clearAuditLogs(): void {
    TerminalSafetyService.auditLogs = [];
  }
}

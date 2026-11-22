import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BirthHubLogo } from '../../../../components/brand/BirthHubLogo.js';
import { BRAND } from '../../../../config/brand.js';

export function LuxuryFooter() {
  return (
    <footer className="relative py-16 bg-[#08080A] border-t border-white/[0.08] text-[#9EADC8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-12 border-b border-white/[0.08]">
          {/* Logo & Manifesto */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3 max-w-sm">
            <div className="flex items-center gap-3">
              <BirthHubLogo variant="symbol" className="h-9 w-9" />
              <span className="font-extrabold text-lg text-[#F8F9FF] tracking-tight">
                BIRTH HUB <span className="text-[#FFC107]">360º</span>
              </span>
            </div>
            <p className="text-xs text-[#9EADC8] leading-relaxed">
              Central de comando inteligente: conectando dados, potencializando decisões e
              acelerando a execução.
            </p>
          </div>

          {/* Links Institucionais & Compliance */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 font-mono text-xs uppercase tracking-wider">
            <Link to="/privacy" className="hover:text-[#00D4FF] transition-colors">
              Privacidade & LGPD
            </Link>
            <Link to="/terms" className="hover:text-[#00D4FF] transition-colors">
              Termos de Uso
            </Link>
            <Link to="/login" className="hover:text-[#FFC107] transition-colors">
              Acesso ao Sistema
            </Link>
          </div>
        </div>

        {/* Linha Final de Direitos e Créditos */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-center sm:text-left text-[#6B7A99]">
          <div>© 2026 Birth Hub 360º. Todos os direitos reservados.</div>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#00D4FF]" />
            <span>{BRAND.credit}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

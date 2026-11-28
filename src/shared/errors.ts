/**
 * `AppError` vive fora de `shared/middlewares/errorHandler.ts` de propósito: o error handler
 * importa `config/env` (dotenv + schema zod do servidor), o que arrastaria todo o ambiente
 * server-side para o bundle do cliente quando um módulo isomórfico (ex.: domínio de
 * `features/activities`) precisasse apenas da classe de erro. Este módulo é livre de
 * dependências de servidor e pode ser importado por código client e server.
 * `errorHandler.ts` re-exporta `AppError` para manter os ~88 imports existentes funcionando.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

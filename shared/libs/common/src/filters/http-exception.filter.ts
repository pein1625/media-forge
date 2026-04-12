import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiResponse } from '@media-forge/types';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: Array<{ field?: string; message: string }> | undefined;

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const { message: msg, error } = exceptionResponse as any;
        message = msg || error || exception.message;

        // Handle validation errors
        if (Array.isArray((exceptionResponse as any).message)) {
          errors = (exceptionResponse as any).message.map(
            (err: string | { field: string; message: string }) => {
              if (typeof err === 'string') {
                return { message: err };
              }
              return err;
            },
          );
        }
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const apiResponse: ApiResponse = {
      success: false,
      message,
      errors,
    };

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Message: ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json(apiResponse);
  }
}

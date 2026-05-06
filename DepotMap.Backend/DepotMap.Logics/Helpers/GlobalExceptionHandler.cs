using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Logics.Helpers
{
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;
        private readonly IHostEnvironment _environment;

        public GlobalExceptionHandler(
            ILogger<GlobalExceptionHandler> logger,
            IHostEnvironment environment)
        {
            _logger = logger;
            _environment = environment;
        }

        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext,
            Exception exception,
            CancellationToken cancellationToken)
        {
            ProblemDetails problemDetails;

            if (exception is AppException appException)
            {
                _logger.LogWarning(exception,
                    "Hiba történt. TraceId: {TraceId}",
                    httpContext.TraceIdentifier);

                problemDetails = new ProblemDetails
                {
                    Title = appException.Title,
                    Detail = appException.Message,
                    Status = appException.StatusCode,
                    Instance = httpContext.Request.Path
                };

                problemDetails.Extensions["traceId"] = httpContext.TraceIdentifier;
                httpContext.Response.StatusCode = appException.StatusCode;
            }
            else
            {
                _logger.LogError(exception,
                    "Nem kezelt kivétel történt. TraceId: {TraceId}",
                    httpContext.TraceIdentifier);

                problemDetails = new ProblemDetails
                {
                    Title = "Belső szerverhiba",
                    Detail = _environment.IsDevelopment()
                        ? exception.Message
                        : "Váratlan hiba történt.",
                    Status = StatusCodes.Status500InternalServerError,
                    Instance = httpContext.Request.Path
                };

                problemDetails.Extensions["traceId"] = httpContext.TraceIdentifier;
                httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
            }

            await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
            return true;
        }
    }
}

using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace DepotMap.Endpoint.Filters
{
    public sealed class ApiExceptionFilter : IExceptionFilter
    {
        private readonly IHostEnvironment _env;
        private readonly ILogger<ApiExceptionFilter> _logger;

        public ApiExceptionFilter(IHostEnvironment env, ILogger<ApiExceptionFilter> logger)
        {
            _env = env;
            _logger = logger;
        }

        public void OnException(ExceptionContext context)
        {
            _logger.LogError(context.Exception, "Unhandled exception");

            var traceId = Activity.Current?.Id ?? context.HttpContext.TraceIdentifier;
            var message = _env.IsDevelopment()
                ? context.Exception.Message
                : "Varatlan hiba tortent.";

            context.Result = new ObjectResult(new ErrorResponse
            {
                Message = message,
                TraceId = traceId
            })
            {
                StatusCode = StatusCodes.Status500InternalServerError
            };

            context.ExceptionHandled = true;
        }
    }

    public sealed class ErrorResponse
    {
        public string Message { get; set; } = string.Empty;
        public string TraceId { get; set; } = string.Empty;
    }
}

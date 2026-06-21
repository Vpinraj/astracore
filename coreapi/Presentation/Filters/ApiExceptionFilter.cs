using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using CoreApi.Core.Exceptions;
using System.Net;

namespace CoreApi.Presentation.Filters;

public class ApiExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        var exception = context.Exception;

        if (exception is DomainException domainException)
        {
            var statusCode = domainException switch
            {
                EntityNotFoundException => HttpStatusCode.NotFound,
                InsufficientFundsException => HttpStatusCode.BadRequest,
                AgentBusyException => HttpStatusCode.BadRequest,
                _ => HttpStatusCode.BadRequest
            };

            var problemDetails = new ProblemDetails
            {
                Status = (int)statusCode,
                Title = "Business Rule Violation",
                Detail = domainException.Message,
                Instance = context.HttpContext.Request.Path
            };

            context.Result = new ObjectResult(problemDetails)
            {
                StatusCode = (int)statusCode
            };

            context.ExceptionHandled = true;
        }
    }
}

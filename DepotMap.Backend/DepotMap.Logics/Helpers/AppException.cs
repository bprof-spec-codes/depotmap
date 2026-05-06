using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DepotMap.Logics.Helpers
{
    public abstract class AppException : Exception
    {
        public int StatusCode { get; }
        public string Title { get; }

        protected AppException(string title, string message, int statusCode)
            : base(message)
        {
            Title = title;
            StatusCode = statusCode;
        }

    }
    public sealed class ConflictException : AppException
    {
        public ConflictException(string message)
            : base("Ütközés", message, StatusCodes.Status409Conflict)
        {
        }
    }
}

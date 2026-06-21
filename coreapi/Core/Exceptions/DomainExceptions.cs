using System;

namespace CoreApi.Core.Exceptions;

public abstract class DomainException : Exception
{
    protected DomainException(string message) : base(message) { }
}

public class EntityNotFoundException : DomainException
{
    public EntityNotFoundException(string entityType, string id) 
        : base($"{entityType} with ID '{id}' was not found.") { }

    public EntityNotFoundException(string message) : base(message) { }
}

public class InsufficientFundsException : DomainException
{
    public InsufficientFundsException(string message) : base(message) { }
}

public class AgentBusyException : DomainException
{
    public AgentBusyException(string message) : base(message) { }
}

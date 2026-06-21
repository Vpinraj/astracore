namespace CoreApi.Application.Commands;

public record CommandResult(
    bool Success,
    string Message
);

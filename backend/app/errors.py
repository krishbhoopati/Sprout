from fastapi import HTTPException


class ApiError(HTTPException):
    """HTTPException that renders the consistent { error: { code, message } } shape."""

    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(status_code=status_code, detail={"code": code, "message": message})
        self.code = code
        self.message = message


def unauthorized(message: str = "Authentication required") -> ApiError:
    return ApiError(401, "unauthorized", message)


def forbidden(message: str = "You do not have access to this resource") -> ApiError:
    return ApiError(403, "forbidden", message)


def not_found(message: str = "Resource not found") -> ApiError:
    return ApiError(404, "not_found", message)


def validation_error(message: str) -> ApiError:
    return ApiError(422, "validation_error", message)


def upstream_unavailable(message: str = "An upstream service is unavailable") -> ApiError:
    return ApiError(503, "upstream_unavailable", message)

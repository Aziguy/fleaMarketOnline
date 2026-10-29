from ninja.security import HttpBearer

from .models import ApiToken


class TokenAuth(HttpBearer):
    """En-tête « Authorization: Bearer mm_... »."""

    def authenticate(self, request, token):
        api_token = ApiToken.objects.authenticate(token)
        if api_token is None:
            return None
        request.user = api_token.user
        request.api_token = api_token
        return api_token.user

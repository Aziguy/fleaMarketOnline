import base64
import hashlib
import secrets

from cryptography.fernet import Fernet
from django.conf import settings


def _fernet():
    key = settings.MFA_ENCRYPTION_KEY or settings.SECRET_KEY
    digest = hashlib.sha256(f"mfa:{key}".encode()).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt(token: str) -> str:
    return _fernet().decrypt(token.encode()).decode()


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def token(nbytes=32) -> str:
    return secrets.token_urlsafe(nbytes)

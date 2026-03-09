import os
import logging
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

security = HTTPBearer()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

# JWKS client for ES256 token verification (newer Supabase projects)
_jwks_client = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwks_client


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Extract and verify the Supabase user ID from the JWT bearer token.

    Supports both HS256 (legacy) and ES256 (newer Supabase projects).
    Returns the user's UUID string (from auth.users.id).
    Raises 401 if the token is missing or invalid.
    """
    token = credentials.credentials
    try:
        # Peek at the token header to determine the algorithm
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg == "HS256":
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        else:
            # ES256 — fetch the public key from Supabase JWKS endpoint
            signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                audience="authenticated",
            )

        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError as e:
        logger.error("JWT verification failed: %s | Token prefix: %s...", e, token[:20] if token else "EMPTY")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {e}",
        )

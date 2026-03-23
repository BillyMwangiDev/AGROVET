"""
Safaricom Daraja API client — STK Push (Lipa Na M-Pesa Online).

Environment variables required:
  MPESA_CONSUMER_KEY
  MPESA_CONSUMER_SECRET
  MPESA_BUSINESS_SHORT_CODE   (e.g. 174379 for sandbox)
  MPESA_PASSKEY               (from Daraja portal)
  MPESA_CALLBACK_URL          (publicly accessible URL, e.g. https://yourapp.ngrok.io/api/pos/mpesa/callback/)
  MPESA_ENVIRONMENT           sandbox | production  (default: sandbox)
"""

import base64
import os
from datetime import datetime

import requests


def _get_env(key: str) -> str:
    val = os.environ.get(key, "")
    return val


def _base_url() -> str:
    env = _get_env("MPESA_ENVIRONMENT") or "sandbox"
    return (
        "https://sandbox.safaricom.co.ke"
        if env == "sandbox"
        else "https://api.safaricom.co.ke"
    )


def get_access_token() -> str:
    """Fetch OAuth2 token from Daraja."""
    key = _get_env("MPESA_CONSUMER_KEY")
    secret = _get_env("MPESA_CONSUMER_SECRET")
    credentials = base64.b64encode(f"{key}:{secret}".encode()).decode()

    resp = requests.get(
        f"{_base_url()}/oauth/v1/generate?grant_type=client_credentials",
        headers={"Authorization": f"Basic {credentials}"},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def stk_push(phone: str, amount: int, account_reference: str, description: str) -> dict:
    """
    Initiate a Lipa Na M-Pesa Online (STK Push) request.

    Args:
        phone: Customer phone in 254XXXXXXXXX format.
        amount: Amount in KES (integer).
        account_reference: Short reference (≤12 chars).
        description: Transaction description (≤13 chars).

    Returns:
        Daraja response dict with CheckoutRequestID etc.
    """
    shortcode = _get_env("MPESA_BUSINESS_SHORT_CODE")
    passkey = _get_env("MPESA_PASSKEY")
    callback_url = _get_env("MPESA_CALLBACK_URL")

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(
        f"{shortcode}{passkey}{timestamp}".encode()
    ).decode()

    token = get_access_token()
    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phone,
        "PartyB": shortcode,
        "PhoneNumber": phone,
        "CallBackURL": callback_url,
        "AccountReference": account_reference[:12],
        "TransactionDesc": description[:13],
    }

    resp = requests.post(
        f"{_base_url()}/mpesa/stkpush/v1/processrequest",
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()

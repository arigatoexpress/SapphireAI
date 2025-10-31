# Security Policy

The project now consists of a minimal Cloud Run service. The security surface is therefore small, but the following guidelines apply.

## Secrets

- Prefer **Google Secret Manager** for production deployments. The service automatically falls back to environment variables when running locally.
- Never commit `.env` files or other plaintext credentials.
- Rotate exchange API keys regularly and scope them to the minimum permissions required (read + trading only).

## Runtime

- All outbound calls to Aster DEX are performed over HTTPS/WSS via `aiohttp`.
- API responses are validated through `pydantic` models before use.
- Paper-trading mode is available to run the service without live credentials.

## Development

- Run `pre-commit` hooks before submitting changes (`pip install pre-commit && pre-commit install`).
- Execute `pytest` to ensure core risk checks remain intact.
- Keep dependencies up to date via `requirements.txt`.

## Reporting Issues

Please disclose vulnerabilities privately:

1. Email: [security@aiaster.com](mailto:security@aiaster.com)
2. Describe the issue, severity, and steps to reproduce.
3. Avoid filing public GitHub issues for security items.

## Contact

- **Email**: [security@aiaster.com](mailto:security@aiaster.com)
- **Security advisories**: create a private report on GitHub.

Last updated: October 2025

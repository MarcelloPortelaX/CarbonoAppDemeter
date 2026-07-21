import os
import sys
import smtplib
from email.message import EmailMessage
from pathlib import Path

def main():
    sender = os.environ.get("APK_EMAIL_SENDER")
    password = os.environ.get("APK_EMAIL_APP_PASSWORD")
    recipient = os.environ.get("APK_EMAIL_RECIPIENT")
    dry_run = os.environ.get("DRY_RUN", "false").lower() == "true"
    
    if not sender or not password or not recipient:
        print("SENDER, PASSWORD, or RECIPIENT not provided. Exiting.")
        sys.exit(1)
        
    commit_sha = os.environ.get("GITHUB_SHA", "unknown")
    version = os.environ.get("APP_VERSION", "unknown")
    release_url = os.environ.get("RELEASE_URL", "unknown")
    apk_path = os.environ.get("APK_PATH", "apps/mobile/dist/demeter-carbono.apk")
    
    msg = EmailMessage()
    msg['Subject'] = "Demeter Carbono — novo APK para instalação"
    msg['From'] = sender
    msg['To'] = recipient
    
    apk_file = Path(apk_path)
    sha256_file = Path(f"{apk_path}.sha256")
    
    sha256_hash = "Não disponível"
    if sha256_file.exists():
        with open(sha256_file, "r") as f:
            sha256_hash = f.read().split()[0]
            
    body = f"""Olá,

O novo APK de testes do Demeter Carbono foi gerado e validado com sucesso.
O Android Smoke Test atestou que o aplicativo inicializa e exibe a tela inicial corretamente.

Commit: {commit_sha}
Versão: {version}
GitHub Release: {release_url}
SHA-256: {sha256_hash}

"""
    
    if apk_file.exists():
        size_mb = apk_file.stat().st_size / (1024 * 1024)
        body += f"Tamanho: {size_mb:.1f} MB\n\n"
        body += f"O APK não está anexado neste e-mail. Por favor, baixe-o diretamente pelo link da Release no GitHub acima."
    else:
        body += "Aviso: Arquivo APK não encontrado no momento da construção do e-mail. Utilize o link da Release."

    body += """\n
Este APK é uma versão de avaliação e triagem preliminar. Ele não representa certificação ou emissão de créditos de carbono.
"""

    msg.set_content(body)
    
    if dry_run:
        print("=== DRY RUN MODE ===")
        print(f"From: {sender}")
        print(f"To: {recipient}")
        print(f"Subject: {msg['Subject']}")
        print(f"Body:\n{body}")
        print("====================")
        print("E-mail validado (dry run) com sucesso!")
        return

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender, password)
            server.send_message(msg)
        print("E-mail enviado com sucesso!")
    except Exception as e:
        print(f"Erro ao enviar e-mail: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

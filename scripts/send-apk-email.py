import os
import sys
import smtplib
from email.message import EmailMessage
from pathlib import Path

def main():
    sender = os.environ.get("APK_EMAIL_SENDER")
    password = os.environ.get("APK_EMAIL_APP_PASSWORD")
    
    if not sender or not password:
        print("SENDER or PASSWORD not provided. Exiting.")
        sys.exit(1)
        
    recipient = "ulquiorraschiffer34cell@gmail.com"
    commit_sha = os.environ.get("GITHUB_SHA", "unknown")
    version = os.environ.get("APP_VERSION", "unknown")
    release_url = os.environ.get("RELEASE_URL", "unknown")
    api_url = os.environ.get("API_URL", "Default/Offline")
    apk_path = os.environ.get("APK_PATH", "dist/demeter-carbono.apk")
    
    msg = EmailMessage()
    msg['Subject'] = "Demeter Carbono — novo APK para instalação"
    msg['From'] = sender
    msg['To'] = recipient
    
    body = f"""Olá,

O novo APK de testes do Demeter Carbono foi gerado com sucesso.

Commit: {commit_sha}
Versão: {version}
GitHub Release: {release_url}
API configurada: {api_url}

Este APK é uma versão de avaliação e triagem preliminar. Ele não representa certificação ou emissão de créditos de carbono.
"""
    
    apk_file = Path(apk_path)
    if apk_file.exists():
        size_mb = apk_file.stat().st_size / (1024 * 1024)
        if size_mb <= 24:
            with open(apk_file, 'rb') as f:
                apk_data = f.read()
            msg.add_attachment(apk_data, maintype='application', subtype='vnd.android.package-archive', filename=apk_file.name)
            body += f"\nO APK está anexado a este e-mail ({size_mb:.1f} MB)."
        else:
            body += f"\nO APK possui {size_mb:.1f} MB, excedendo o limite de anexo. Baixe-o diretamente pelo link da Release acima."
    else:
        body += "\n[Aviso] Arquivo APK não encontrado no momento do envio do e-mail. Utilize o link da Release."

    msg.set_content(body)
    
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

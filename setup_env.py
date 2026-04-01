import os
import secrets

def main():
    print("\n" + "="*50)
    print("🚀 Welcome to FinTrack Workspace Setup!")
    print("="*50 + "\n")

    print("[1/3] MongoDB Setup")
    print("You can get a free DB cluster at https://cloud.mongodb.com")
    mongo_url = input("Enter your MongoDB connection string (e.g. mongodb+srv://...):\n> ").strip()
    
    if not mongo_url:
        print("\n❌ Error: MongoDB URL is required to run FinTrack. Exiting.")
        return

    print("\n[2/3] Google OAuth Setup (Optional)")
    print("Get this from https://console.cloud.google.com")
    google_client_id = input("Enter your Google Client ID (Press Enter to skip for now):\n> ").strip()

    print("\n[3/3] Generating secure JWT Secrets...")
    secret_key = secrets.token_hex(32)
    refresh_secret_key = secrets.token_hex(32)
    print("✅ Secrets generated successfully.")

    # Write backend/.env
    print("\nwriting config files...")
    os.makedirs("backend", exist_ok=True)
    with open(os.path.join("backend", ".env"), "w") as f:
        f.write(f"MONGODB_URL={mongo_url}\n")
        f.write(f"SECRET_KEY={secret_key}\n")
        f.write(f"REFRESH_SECRET_KEY={refresh_secret_key}\n")
        if google_client_id:
            f.write(f"GOOGLE_CLIENT_ID={google_client_id}\n")
    print("✅ Created backend/.env")

    # Write frontend/.env.local
    os.makedirs("frontend", exist_ok=True)
    with open(os.path.join("frontend", ".env.local"), "w") as f:
        f.write("VITE_API_BASE_URL=http://localhost:8000\n")
        if google_client_id:
            f.write(f"VITE_GOOGLE_CLIENT_ID={google_client_id}\n")
    print("✅ Created frontend/.env.local")

    print("\n" + "="*50)
    print("🎉 Setup is complete! You can now start the app:")
    print("Terminal 1: run start_backend.bat")
    print("Terminal 2: run start_frontend.bat")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()

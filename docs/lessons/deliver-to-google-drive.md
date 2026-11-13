# Deliver finished videos to Google Drive (user, 2026-10-25)

Finished episodes are bigger than the chat's 400 MB file limit. The user asked for a way to upload large files to their
Google Drive: `pipeline/upload_drive.sh <file> [subfolder]` (rclone, drive.file scope, token in the environment variable
RCLONE_CONFIG_GDRIVE_TOKEN; setup in docs/CLOUD_SETUP.md). Upload the full-quality master there (a public view link is fine, the user said so) and give the user the
link; still send a smaller viewing copy in the chat. Never print or commit the token.

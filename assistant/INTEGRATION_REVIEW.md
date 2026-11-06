# StoneVeld Assistant — website integration
STATUS: LOCAL INTEGRATION ONLY. There has been no push, public preview deployment or production publication of this bundle.
The copied knowledge file has approvedForPublicDeployment=false. Do NOT push this integration branch to public Cloudflare Pages until the owner explicitly approves public publication of the knowledge.
Copied after 423 automated tests. No remote AI service, database, analytics or paid dependency.
Same-origin iframe isolates the assistant visual styles from all original StoneVeld pages.
Parent and frame communicate only to open/close and restore focus; strict origin and source checks apply.
Update the assistant from its source repo, run npm test and npm run build, then recopy allowlisted dist files if needed. Do not sync repository configuration, docs or credentials.
Pages: homepage, Start Here, Bia, Crow, Wolfbyte, Nexus, open tools, Contingency and RAG project.
Secret Workshop is deliberately excluded.
Local testing: serve the website root at 127.0.0.1:4184 and verify real browsers before any publication.

# Security

Report a vulnerability by email to meda-vermittlung@agentmail.to. Do not open a public GitHub issue for an unfixed security problem.

## CV attachments

The Bewerbung page checks a CV in the browser before submit. The check allows one PDF, DOC, or DOCX file of at most 5 MB. It looks at the extension and the magic bytes (`%PDF`, `D0CF11E0` for DOC, and a PK zip with a `word/` entry for DOCX). It rejects a second extension such as `cv.pdf.exe`, executables, scripts, HTML, SVG, macro files such as `docm`, and archives. A PDF is also rejected when a plain byte scan finds `/JavaScript`, `/JS`, `/Launch`, `/EmbeddedFile`, or `/OpenAction` together with JavaScript.

That check runs in the visitor's browser and can be bypassed. Anyone who can POST the form can skip it. The AgentMail inbox (`meda-vermittlung@agentmail.to`) and anyone who opens a CV must treat the attachment as untrusted. Open CVs only in a viewer or a sandbox. Do not launch them on a work computer.

`apply-worker/` (Worker name `meda-apply`) repeats the check before anything is mailed: extension, magic bytes, 5 MB, and the same active-content scan. It also requires the consent fields, drops a filled honeypot, and allows only `https://meda-vermittlung.de`, `https://www.meda-vermittlung.de`, and `https://g5kjd9v7cf-boop.github.io`. Five posts per IP per hour are kept in memory inside each isolate. Turnstile runs only when `TURNSTILE_SECRET` is set. Delivery is one AgentMail request from `meda-vermittlung@agentmail.to`, with a copy to `MEDA-team@outlook.com`. The Worker does not store the CV. Logs are a code and a status. Deploy with the commands in `apply-worker/DEPLOY.md`. Open every CV in a viewer or a sandbox.

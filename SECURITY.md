# Security

Report a vulnerability by email to meda-vermittlung@agentmail.to. Do not open a public GitHub issue for an unfixed security problem.

## CV attachments

The Bewerbung page checks a CV in the browser before submit. The check allows one PDF, DOC, or DOCX file of at most 5 MB. It looks at the extension and the magic bytes (`%PDF`, `D0CF11E0` for DOC, and a PK zip with a `word/` entry for DOCX). It rejects a second extension such as `cv.pdf.exe`, executables, scripts, HTML, SVG, macro files such as `docm`, and archives. A PDF is also rejected when a plain byte scan finds `/JavaScript`, `/JS`, `/Launch`, `/EmbeddedFile`, or `/OpenAction` together with JavaScript.

That check runs in the visitor's browser and can be bypassed. Anyone who can POST the form can skip it. The AgentMail inbox (`meda-vermittlung@agentmail.to`) and anyone who opens a CV must treat the attachment as untrusted. Open CVs only in a viewer or a sandbox. Do not launch them on a work computer.

PR #30 plans the server-side scan: the apply Worker checks size (5 MB), extension, and PDF/DOC/DOCX magic bytes before the file is mailed through AgentMail. Until that Worker stands in front of the form, the inbox is the only copy after the browser.

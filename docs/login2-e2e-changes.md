# Login2 E2E changes

- **Product fixes:** preserve mounted journey context after resume; continue validated AM OAuth requests; enforce consent, complete OTPs, required passwords, and valid fields before submission.
- **Test-only changes:** update resume mocks and URL expectations, exercise consent with intercepted AM fixtures, wait for button readiness, and check that invalid registration stays local without an AM request.

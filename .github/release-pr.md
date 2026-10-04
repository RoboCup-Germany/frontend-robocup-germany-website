Dieser Pull Request wurde automatisch erstellt, nachdem der aktuelle `staging`-Commit erfolgreich ausgerollt und getestet wurde.

## Automatisch geprüft

- [x] Lint, Typecheck, Unit-Tests und Nuxt-Build
- [x] Deployment auf [test.robocup.de](https://test.robocup.de)
- [x] Smoke-Test auf [test.robocup.de](https://test.robocup.de)
- [x] Smoke-Test auf [testwm.robocup.de](https://testwm.robocup.de)
- [x] Erreichbarkeit von [testapi.robocup.de](https://testapi.robocup.de)

## Manuelle Freigabe

- [ ] Hauptnavigation und wichtige Inhaltsseiten geprüft
- [ ] Deutsche und englische Inhalte geprüft
- [ ] WM-Frontend geprüft
- [ ] Freigabe durch eine zweite Person erteilt

Nach dem Merge wird exakt das auf Staging getestete Docker-Image nach Produktion übernommen. Bitte keine zusätzlichen Commits direkt in diesen Pull Request einbringen; Änderungen gehören zuerst nach `staging`.

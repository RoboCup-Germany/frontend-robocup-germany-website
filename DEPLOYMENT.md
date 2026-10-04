# Staging- und Produktionsprozess

## Zielbild

```text
feature/* -> Pull Request -> staging
                            |
                            +-> Image sha-<commit>
                            +-> deploy/staging -> Argo CD
                            +-> test.robocup.de
                            +-> testwm.robocup.de
                            +-> testapi.robocup.de
                            +-> Smoke-Tests
                            |
                            +-> automatischer PR staging -> main
                                                     |
                                                     +-> Review und Merge
                                                     +-> dasselbe Image
                                                     +-> deploy/production
                                                     +-> Argo CD
```

Die Branches `deploy/staging` und `deploy/production` enthalten ausschließlich
den von GitHub Actions erzeugten gewünschten Kubernetes-Zustand. Dadurch muss
kein Bot nach `main` oder `staging` pushen. Argo CD folgt den Deployment-Branches,
während die Anwendungscode-Branches durch Pull Requests geschützt bleiben.

## Einmalige GitHub-Einrichtung

### Branch `staging`

Den Branch einmalig vom aktuellen `main` erstellen und veröffentlichen:

```bash
git switch main
git pull --ff-only
git switch -c staging
git push -u origin staging
```

Danach gehen alle Feature- und Fehlerkorrekturen per Pull Request nach
`staging`. Nur der automatisch erzeugte Release-PR führt von `staging` nach
`main`.

### Actions-Einstellungen

Unter **Settings -> Actions -> General -> Workflow permissions**:

- `Read repository contents and packages permissions` als Standard verwenden.
- `Allow GitHub Actions to create and approve pull requests` aktivieren. Der
  Workflow erstellt PRs, genehmigt sie aber nicht selbst.
- Schreibrechte werden in den Workflows nur für die einzelnen Deployment- und
  PR-Jobs freigeschaltet.

Folgende Repository- oder Organisations-Secrets werden benötigt:

| Secret | Inhalt |
| --- | --- |
| `DOCKER_URL` | Registry-Host, zum Beispiel `registry.robocup.de` |
| `DOCKER_USERNAME` | auf `website/frontend` beschränkter Robot-Account |
| `DOCKER_PASSWORD` | Passwort oder Token des Robot-Accounts |

Der Registry-Account benötigt Push- und Pull-Rechte für
`website/frontend`. Er benötigt keinerlei GitHub-Schreibrechte.

### Environment `staging`

Unter **Settings -> Environments** ein Environment `staging` anlegen:

- Deployment branch: nur `staging`
- Environment URL: `https://test.robocup.de`
- keine manuelle Freigabe vor dem Deployment
- keine Produktions-Secrets

Der Job `staging / deployed and tested` wird erst erfolgreich, wenn beide
Frontend-Domains die erwartete Release-SHA ausliefern, ihre Startseiten
erreichbar sind und `https://testapi.robocup.de/?type=834` antwortet. Damit repräsentiert
ein erfolgreiches GitHub-Deployment tatsächlich eine getestete Staging-Version.

### Environment `production`

Ein Environment `production` anlegen:

- Deployment branch: nur `main`
- Environment URL: `https://robocup.de`
- Required reviewers: zuständige Release-Verantwortliche
- `Prevent self-review` aktivieren
- keinen Administrator-Bypass erlauben

Die Produktionsfreigabe übernimmt das bereits auf Staging gebaute Image. Es
wird kein zweites Image gebaut. Vor dem Deployment vergleicht der Workflow
zusätzlich den Git-Tree des gemergten `main`-Commits mit dem getesteten
`staging`-Commit. Eine unerwartete Abweichung stoppt die Promotion.

### Ruleset `protect-staging`

Unter **Settings -> Rules -> Rulesets** ein aktives Branch-Ruleset für
`staging` anlegen:

- Löschen und Force-Push verbieten
- Pull Request vor dem Merge verlangen
- mindestens eine Approval verlangen
- veraltete Approvals bei neuen Commits verwerfen
- Freigabe des letzten Pushs durch eine andere Person verlangen
- alle Diskussionen müssen erledigt sein
- Statuscheck `CI / verify` verlangen
- Branch muss vor dem Merge aktuell sein
- keine Bypass-Benutzer oder Bypass-Tokens

### Ruleset `protect-main`

Ein aktives Branch-Ruleset für den Default-Branch `main` anlegen:

- Löschen und Force-Push verbieten
- Pull Request vor dem Merge verlangen
- mindestens eine Approval, empfohlen zwei
- veraltete Approvals bei neuen Commits verwerfen
- Freigabe des letzten Pushs durch eine andere Person verlangen
- Code-Owner-Review aktivieren, sobald ein passendes `CODEOWNERS`-Team besteht
- alle Diskussionen müssen erledigt sein
- Statuschecks `CI / verify` und `release gate / staging candidate` verlangen
- erfolgreiches Deployment in das Environment `staging` verlangen
- keine Bypass-Benutzer, Administratoren oder Automation-Tokens

Für den langlebigen Promotion-Branch `staging` wird auf `main` bewusst nicht
`Require branches to be up to date` aktiviert. Nach einem Release ist der neue
Merge-Commit nur in `main`, während der getestete Commit in `staging` bleibt.
Da `main` ausschließlich aus diesem einen Promotion-Branch beliefert wird, gibt
es keine konkurrierenden Release-PRs; das erzwungene Nachziehen würde dagegen
unnötig ein neues Staging-Deployment auslösen.

Der Check `release gate / staging candidate` entsteht ausschließlich nach einem
erfolgreichen Push auf `staging`. Ein beliebiger Feature-Branch kann deshalb die
Anforderungen für einen direkten PR nach `main` nicht erfüllen.

Die Checks müssen mindestens einmal gelaufen sein, bevor sie in einem Ruleset
ausgewählt werden können. Deshalb die Rulesets erst nach dem ersten erfolgreichen
Staging-Lauf vollständig aktivieren.

### Deployment-Branches

Die Workflows erzeugen und aktualisieren automatisch:

- `deploy/staging`
- `deploy/production`

Für diese beiden Branches optional ein eigenes Ruleset anlegen:

- Löschen und Force-Push verbieten
- Updates nur durch GitHub Actions zulassen
- keine Pull-Request-Pflicht, weil die Branches generierte Deployment-Artefakte
  enthalten

Die Branches dürfen nicht als Entwicklungsbranches verwendet werden.

## Argo CD

Die beiden Application-Manifeste liegen unter `.argo/applications`:

- `frontend-staging.yaml` folgt `deploy/staging` und `.argo/staging`
- `frontend-production.yaml` folgt `deploy/production` und `.argo/production`

Beide Anwendungen verwenden Auto-Sync, Pruning, Self-Healing und Retry. Die
Staging-Anwendung vor dem ersten Push auf `staging` einmalig im Argo-CD-Cluster
anlegen. Dass `deploy/staging` zu diesem Zeitpunkt noch fehlt, ist beim
Bootstrap erwartbar; der erste Staging-Workflow erzeugt den Branch:

```bash
kubectl apply -f .argo/applications/frontend-staging.yaml
```

Falls die bestehende Produktions-Anwendung derzeit direkt `main` verfolgt, darf
keine zweite Anwendung parallel dieselben Ressourcen verwalten. Vor dem ersten
Merge des Release-PRs die bestehende Anwendung auf `deploy/production` und den
Pfad `.argo/production` umstellen oder, falls noch keine Produktions-Anwendung
existiert, folgendes Manifest anwenden:

```bash
kubectl apply -f .argo/applications/frontend-production.yaml
```

Dass der Branch vor dem ersten Release noch nicht existiert, ist erwartbar. Das
bisherige Produktions-Deployment bleibt dabei bestehen. Sobald der erste
Produktions-Workflow `deploy/production` erzeugt, kann Argo CD synchronisieren
und der Workflow anschließend die produktiven Endpunkte prüfen.

Argo CD benötigt Leserechte auf dieses Repository. GitHub Actions benötigt
keinen Kubernetes- oder Argo-CD-Token: Es schreibt nur den gewünschten Zustand
in die beiden Deployment-Branches und wartet anschließend über die öffentlichen
Health-Endpunkte auf den Rollout.

## Kubernetes

### Staging

Die Manifeste unter `.argo/staging` erzeugen:

- Namespace-Ziel `staging-website`
- Deployment und Service `frontend`
- Ingress für `test.robocup.de` und `testwm.robocup.de`
- TLS über den Cluster-Issuer `my-letsencrypt-prod`
- ConfigMap mit den beiden Site-Konfigurationen
- Health-Probes auf `/api/health`

Vor dem ersten Sync müssen im Namespace zwei Secrets vorhanden sein:

```bash
kubectl create namespace staging-website
kubectl -n staging-website create secret docker-registry registry \
  --docker-server=registry.robocup.de \
  --docker-username='<registry-user>' \
  --docker-password='<registry-password>'
kubectl -n staging-website create secret generic website-frontend \
  --from-literal=NUXT_FLICKR_API_KEY='<flickr-api-key>'
```

Secrets niemals in Git einchecken. Falls im Cluster External Secrets oder
Sealed Secrets eingesetzt werden, sollen die beiden Secrets darüber erzeugt
werden.

### Produktion

Das Produktions-Deployment besitzt jetzt:

- eine Release-SHA zur eindeutigen Rollout-Prüfung
- immutable `sha-<commit>`-Images nach der ersten Promotion

## DNS, TLS und Backend

Folgende DNS-Namen müssen auf den jeweiligen Ingress-Controller zeigen:

| Hostname | Ziel |
| --- | --- |
| `test.robocup.de` | Ingress des Frontend-Clusters |
| `testwm.robocup.de` | Ingress des Frontend-Clusters |
| `testapi.robocup.de` | Ingress des TYPO3-/Backend-Clusters |

Das Backend-Repository beziehungsweise die Backend-Infrastruktur muss einen
Ingress mit dem Host `testapi.robocup.de`, TLS und Weiterleitung auf den
TYPO3-Service bereitstellen. Der konkrete Service-Name und Port sind in diesem
Frontend-Repository nicht bekannt und werden deshalb nicht erfunden.

Das Frontend ist bereits vollständig auf dieses Backend eingestellt:

- Default-Site: `test.robocup.de` -> `https://testapi.robocup.de`
- WM-Site: `testwm.robocup.de` -> `https://testapi.robocup.de/wm27`
- der Upstream-Host lautet `testapi.robocup.de`
- Browserzugriffe laufen weiterhin über den lokalen Frontend-Proxy
  `/api/typo3`; dadurch ist für das Frontend selbst kein CORS erforderlich

TYPO3 muss beide Frontend-Hosts als erlaubte Site-Varianten kennen. Falls das
Backend auf `X-Forwarded-Host` auswertet, müssen `test.robocup.de` und
`testwm.robocup.de` freigegeben sein.

Der Staging-Workflow schlägt fehl und erstellt keinen Release-PR, solange der
TYPO3-Endpunkt `https://testapi.robocup.de/?type=834` nicht per HTTPS erreichbar
ist.

## Automatischer Release-PR

Nach einem erfolgreichen Staging-Deployment prüft der Workflow, ob bereits ein
offener PR `staging -> main` existiert:

- existiert keiner, wird er mit `.github/release-pr.md` erstellt
- existiert bereits einer, wird kein Duplikat erzeugt; neue Staging-Commits
  erscheinen automatisch im bestehenden PR
- neue Commits verwerfen durch das Ruleset alte Freigaben
- nach dem Merge promoted der Produktions-Workflow das Image
  `sha-<staging-commit>`

Das bisherige Version-Bumping und der direkte Push durch
`ACTIONS_DEPLOY_TOKEN` wurden entfernt. Versionen und Release-Tags können später
in einem getrennten, PR-basierten Release-Schritt ergänzt werden; sie sind nicht
mehr Teil des Deployments.

## Zweites Frontend

`test.robocup.de` und `testwm.robocup.de` werden aktuell aus demselben Image
bedient. Die Anwendung wählt Domain, Theme und TYPO3-Pfad zur Laufzeit. Das ist
für die im Repository vorhandene Multi-Site-Architektur der bevorzugte Weg.

Soll das WM-Frontend später tatsächlich eine dauerhaft abweichende Codebasis in
einem anderen Branch erhalten, braucht es einen eigenen Staging- und
Produktionszweig sowie eigene Images und Argo-CD-Anwendungen. Ein einzelner
zusätzlicher Produktionsbranch ohne zugehörigen Staging-Branch würde die hier
eingerichtete Freigabegarantie umgehen.

## Normaler Arbeitsablauf

1. `feature/*` erstellen und nach `staging` pull-requesten.
2. `CI / verify` und Review abwarten.
3. Nach dem Merge baut und deployt der Staging-Workflow.
4. Beide Frontends und das Test-Backend werden automatisch geprüft.
5. GitHub Actions erstellt oder aktualisiert den Release-PR nach `main`.
6. Eine andere Person führt die fachliche Abnahme auf Staging durch und
   genehmigt den PR.
7. Nach dem Merge wartet das Production-Environment auf seine Freigabe und
   promoted exakt das getestete Image.
8. Der Workflow prüft abschließend `robocup.de` und `wm.robocup.de`.

Ein Rollback erfolgt durch erneutes Setzen eines zuvor erfolgreichen Image-Tags
im Deployment-Branch oder durch Revert des betreffenden Deployment-Commits.

## Bootstrap-Reihenfolge

1. Diesen einmaligen Bootstrap-Commit direkt nach `main` pushen, solange die
   neuen Rulesets noch nicht aktiviert sind. Danach erfolgen keine direkten
   Pushes nach `main` mehr.
2. DNS und Backend-Ingress für `testapi.robocup.de` einrichten.
3. DNS für `test.robocup.de` und `testwm.robocup.de` einrichten.
4. Namespace sowie Registry- und Frontend-Secret anlegen.
5. GitHub-Secrets, Environments und die Actions-PR-Berechtigung konfigurieren.
6. `website-frontend-staging` in Argo CD anlegen.
7. `staging` aus dem neuen `main` erstellen und pushen. Dieser Lauf erzeugt
   `deploy/staging`, rollt Staging aus und erstellt nach erfolgreichen Tests den
   ersten Release-PR.
8. Erst wenn die Check-Namen sichtbar sind, die beiden Rulesets vollständig
   aktivieren.
9. Vor dem Merge des ersten Release-PRs die bestehende Produktions-Anwendung
   kontrolliert auf `deploy/production` umstellen oder neu anlegen.
10. Den Release-PR freigeben und mergen. Der Produktions-Workflow erzeugt den
    Deployment-Branch und Argo CD übernimmt danach exakt das auf Staging
    getestete Image.

"""Génère les pages HTML statiques du portfolio (FR + EN dans chaque page).

Usage : python3 outils/build_site.py   (depuis la racine du site)

Tout le texte du site est ici, en français et en anglais. En-tête, pied de page et
gabarit des pages POC sont partagés : modifier une fois, régénérer, et les 6 pages suivent.
Pour ajouter un POC : ajouter une entrée dans POCS, relancer le script.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

EMAIL = "adamzpro@icloud.com"
GITHUB = "https://github.com/Adamzou-lab"
LINKEDIN = "https://www.linkedin.com/in/adam-zouaoui-7392a53b2/"
CV_PDF = "Adam_Zouaoui_CV.pdf"  # à déposer à la racine du site


# ---------------------------------------------------------------- helpers
def t(fr, en):
    """Texte en ligne bilingue."""
    if fr == en:
        return fr
    return f'<span data-l="fr">{fr}</span><span data-l="en" lang="en">{en}</span>'


def tb(tag, fr, en, attrs=""):
    """Bloc bilingue : un élément par langue."""
    a = f" {attrs}" if attrs else ""
    return f'<{tag} data-l="fr"{a}>{fr}</{tag}><{tag} data-l="en" lang="en"{a}>{en}</{tag}>'


def attr(s):
    return s.replace("&", "&amp;").replace('"', "&quot;")


SVG = {
    "right": '<path d="M2.5 8h10.5M9 4l4 4-4 4"/>',
    "left": '<path d="M13.5 8H3M7 4 3 8l4 4"/>',
    "out": '<path d="M5 11 11 5M6 4.5h5.5V10"/>',
    "down": '<path d="M8 2.5V13M4 9l4 4 4-4"/>',
    "replay": '<path d="M3 8a5 5 0 1 0 1.5-3.6"/><path d="M3 2.5v3h3"/>',
}


def icon(name, size=14):
    return (f'<svg class="i-{name}" viewBox="0 0 16 16" width="{size}" height="{size}" aria-hidden="true" '
            f'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">{SVG[name]}</svg>')


FAVICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' "
           "fill='%23111110'/%3E%3Ctext x='50%25' y='54%25' text-anchor='middle' dominant-baseline='middle' font-family='Georgia,serif' "
           "font-size='40' fill='%23f4f4f1'%3EA.%3C/text%3E%3C/svg%3E")

FONTS = ("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500"
         "&family=IBM+Plex+Sans:ital,wght@0,400;0,500;1,400&family=Instrument+Serif:ital@0;1&display=swap")


# ---------------------------------------------------------------- contenu
ROLE = ("Développeur full-stack &amp; IA agentique", "Full-stack &amp; agentic AI developer")

HERO = {
    "tagline": "The problems I encountered became <em>these solutions.</em>",
    "desc": ("Je construis des choses pour résoudre des problèmes que je rencontre vraiment. Je les documente parce que la "
             "réflexion derrière une solution compte autant que la solution elle-même.",
             "I build things to solve problems I actually face. I document them because the thinking behind a solution "
             "matters as much as the solution itself."),
}

STEPS = [
    (("Le problème", "The problem"), ("Ce qui bloquait, au quotidien ou dans ma cohorte.", "What was getting in the way, day to day or in my cohort.")),
    (("Mon approche", "My approach"), ("Les choix techniques, et pourquoi ceux-là.", "The technical choices, and why those.")),
    (("Le POC", "The POC"), ("Ce qui tourne en ligne, limites comprises.", "What runs live, limits included.")),
    (("Ce que j'en ai appris", "What I took away"), ("La leçon qui reste quand le code change.", "The lesson that outlasts the code.")),
    (("Ce que je ferais en prod", "What I'd do in prod"), ("La suite pour passer à l'échelle.", "The next step to make it scale.")),
]
SEC_IDS = ["probleme", "approche", "poc", "appris", "prod"]

POCS = [
    {
        "slug": "holberton-cheatsheets", "n": "01", "title": "Holberton Cheatsheets",
        "date": ("Mars 2026", "March 2026"), "iso": "2026-03", "live": "cheatsheets.adamzou.fr",
        "tags": ["HTML", "CSS", "JS", "VPS", "Nginx"],
        "desc": ("Les étudiants à Holberton perdent du temps à chercher les mêmes choses chaque semaine. Pas d'endroit central, "
                 "rien d'adapté à notre cursus. J'ai construit une bibliothèque de cheatsheets couvrant toute la première année, "
                 "organisée par chapitre.",
                 "Students at Holberton lose time searching the same things every week. No central place, nothing built for our "
                 "curriculum. I built a cheatsheet library covering our entire first year, organized by chapter."),
        "facts": [("5+", ("domaines : C, Git, Docker, Python, Sécurité", "areas: C, Git, Docker, Python, Security")),
                  ("h → min", ("temps de création d'une fiche", "time to create a sheet")),
                  ("XP", ("progression et niveaux de difficulté", "progress and difficulty levels")),
                  ("SSH", ("déploiement direct sur le VPS", "direct deploy to the VPS"))],
        "problem": ("L'école que je fréquente, Holberton School, utilise une méthode d'apprentissage par projet à l'américaine. Pas de "
                    "cours formels, pas de manuels, pas de professeur pour expliquer le chapitre. Chaque lundi un nouveau projet arrive, "
                    "et il est dû vendredi. Il faut tout comprendre par soi-même : chercher sur internet, lire la documentation, "
                    "assembler des informations de sources dispersées. À un moment j'ai réalisé que chaque étudiant de ma classe perdait "
                    "du temps à chercher les mêmes choses. Il n'y avait pas d'endroit central pour trouver ce dont on avait besoin, rien "
                    "construit pour notre cursus, rien qui parlait notre langage.",
                    "The school I attend, Holberton School, uses an American project-based learning method. There are no formal lessons, "
                    "no textbooks, no teacher explaining the chapter. Every Monday a new project drops, and it's due Friday. We have to "
                    "figure everything out by ourselves: searching the internet, reading documentation, piecing things together from "
                    "scattered sources. At some point I realized that every student in my class was losing time searching for the same "
                    "things. There was no central place to find what we needed, nothing built for our curriculum, nothing that spoke our language."),
        "approach": ("Pour chaque chapitre, j'ai construit un cheatsheet regroupant les concepts clés en un seul endroit. Pour gérer les "
                     "demandes efficacement, j'ai configuré une IA avec le format et la structure exacte du cheatsheet. Quand un étudiant "
                     "demande un nouveau sujet, je transmets la demande à l'IA et déploie le résultat sur mon VPS via SSH. Le temps de "
                     "création est passé de plusieurs heures à quelques minutes.",
                     "For each chapter, I built a cheatsheet grouping the key concepts of that chapter in one place. To handle student "
                     "requests efficiently, I configured an AI with the exact cheatsheet format and structure. When a student asks for a new "
                     "topic, I feed the request to the AI and deploy the output to my VPS via SSH. Creation time went from hours to minutes."),
        "poc": ("Une bibliothèque croissante de cheatsheets couvrant toute notre première année : C, Git, Docker, Python, Sécurité et plus "
                "encore. Un système de gamification avec XP et niveaux de difficulté. Un formulaire de demande pour que les étudiants "
                "puissent demander de nouveaux sujets directement.",
                "A growing library of cheatsheets covering our entire first year curriculum: C, Git, Docker, Python, Security and more. "
                "A gamification system with XP and difficulty levels. A request form so students can ask for new topics directly."),
        "learned": (("La précision de l'audience est plus importante que la qualité de l'outil.",
                     "Je n'ai pas construit pour des étudiants en général, j'ai construit pour ma cohorte, avec leur cursus exact et leurs "
                     "besoins précis. C'est pour ça que les cheatsheets sont encore utilisées aujourd'hui."),
                    ("Precision of audience matters more than quality of the tool.",
                     "I didn't build for students in general, I built for my cohort, with their exact curriculum and their specific needs. "
                     "That's why the cheatsheets are still being used today.")),
        "prod": ("Je construirais un pipeline agentique complet : un agent IA qui lit les emails entrants via une API mail (Gmail, Mailgun), "
                 "extrait le sujet demandé, génère le cheatsheet de manière autonome dans la même structure que les autres via l'API "
                 "Claude, valide le format, et déploie automatiquement via une simple commande SSH sur mon VPS. Zéro intervention humaine, "
                 "de la demande étudiant à la page en ligne.",
                 "I'd build a full agentic pipeline: an AI agent that reads incoming emails via a mail API (Gmail, Mailgun), extracts the "
                 "requested topic, generates the cheatsheet autonomously in the exact same structure as the others using the Claude API, "
                 "validates the format, and deploys automatically via a simple SSH command to my VPS. Zero human intervention, from student "
                 "request to live page."),
    },
    {
        "slug": "az-qcm", "n": "02", "title": "AZ·QCM",
        "date": ("Mars 2026", "March 2026"), "iso": "2026-03", "live": "qcm.adamzou.fr",
        "tags": ["HTML", "CSS", "JS", "VPS", "Nginx"],
        "desc": ("Chaque jeudi matin, Holberton organise un quiz surprise sur les concepts de la semaine. Pas de support de révision fourni, "
                 "rien d'adapté à notre cursus. J'ai construit un QCM mobile-first pour que ma cohorte puisse s'entraîner la veille ou "
                 "dans les transports.",
                 "Every Thursday morning, Holberton runs a surprise quiz on the week's concepts. No revision tool provided, nothing built "
                 "for our curriculum. I built a mobile-first quiz app so my cohort could practice the night before or on the commute."),
        "facts": [("10", ("thèmes du T1 en langage C", "T1 topics in C")),
                  ("~130", ("questions au total", "questions in total")),
                  ("4", ("choix par question", "choices per question")),
                  ("0", ("compte à créer", "account to create"))],
        "problem": ("Holberton School fonctionne sans cours magistraux, sans manuels, sans professeur qui explique le chapitre. Chaque lundi "
                    "un nouveau projet arrive, dû vendredi. On apprend en cherchant, en lisant, en se trompant. Chaque jeudi matin, l'école "
                    "organise un quiz pour vérifier que les concepts de la semaine ont bien été assimilés. Le problème : aucun outil de "
                    "révision n'existe pour notre cursus. Pas de Quizlet, pas d'Anki adapté à Holberton, rien de spécifique à ce que nous "
                    "étudions. Les étudiants arrivaient au quiz sans s'être entraînés, non pas par manque de motivation, mais parce qu'il "
                    "n'existait rien de pratique pour tester ses connaissances sur les sujets précis que nous avions vus.",
                    "Holberton School runs without lectures, textbooks, or teachers explaining the material. Every Monday a new project "
                    "drops, due Friday. We learn by searching, reading, and making mistakes. Every Thursday morning, the school runs a quiz "
                    "to check whether the week's concepts have actually sunk in. The problem: no revision tool exists for our curriculum. "
                    "No Quizlet, no Anki adapted to Holberton, nothing specific to what we study. Students arrived at the quiz without having "
                    "practiced, not from lack of motivation, but because nothing practical existed to test their knowledge on the exact "
                    "topics we had covered."),
        "approach": ("Je voulais un outil qu'on utilise réellement à 8h dans le bus, pas assis devant un bureau. Mobile-first, sans compte, "
                     "sans friction. L'étudiant choisit les thèmes qu'il veut réviser, ou tous d'un coup, et répond à des questions à 4 "
                     "choix, et peut refaire uniquement ses erreurs pour identifier précisément ses lacunes. Chaque thème correspond "
                     "directement à un chapitre du cursus T1, et chaque question est calibrée sur ce que Holberton nous évalue réellement.",
                     "I wanted a tool students would actually use at 8am on the bus, not sitting at a desk. Mobile-first, no account needed, "
                     "no friction. Pick the topics you want to revise, or all at once, answer four-choice questions, and at the end redo only "
                     "your mistakes to identify your gaps precisely. Every topic maps directly to a chapter from our T1 curriculum, and every "
                     "question is calibrated to what Holberton actually tests us on."),
        "poc": ("10 thèmes couvrant l'intégralité du Langage C du premier trimestre : Pointeurs, Malloc et Mémoire, Pointeurs de fonctions, "
                "Récursion, Variadic Functions, Arrays, Structures et Typedef, Valgrind, GDB, Strings. Environ 130 questions au total. "
                "Sélection de thèmes, barre de progression par question, mode erreurs pour refaire uniquement ce qu'on a raté, dark mode. "
                "Ce POC couvre le premier trimestre dans son intégralité. Le deuxième trimestre (Python, SQL, POO, data science) n'est pas "
                "encore intégré : le site est fonctionnel mais pas complet.",
                "10 topics covering the entire T1 C curriculum: Pointers, Malloc and Memory, Function Pointers, Recursion, Variadic "
                "Functions, Arrays, Structures and Typedef, Valgrind, GDB, Strings. Around 130 questions in total. Topic selection, "
                "per-question progress bar, error-only mode to redo what you got wrong, dark mode. This POC covers the first semester in "
                "full. The second semester (Python, SQL, OOP, data science) is not yet integrated: the site works but is not complete."),
        "learned": (("Un outil qui s'intègre dans une routine existante a beaucoup plus d'impact qu'un outil qui demande d'en créer une nouvelle.",
                     "Les étudiants avaient déjà le quiz du jeudi dans leur semaine. Le QCM s'est glissé dedans naturellement, et ça a "
                     "changé leur façon de se préparer."),
                    ("A tool that fits into an existing routine has far more impact than one that asks people to build a new one.",
                     "Students already had the Thursday quiz in their week. The QCM slipped into that naturally, and it changed the way "
                     "they prepared.")),
        "prod": ("Les cheatsheets et le QCM résolvent deux problèmes complémentaires : l'un pour apprendre, l'autre pour tester. En "
                 "production, je les lierais dans un pipeline agentique complet. Quand une nouvelle leçon est publiée sur "
                 "cheatsheets.adamzou.fr, un agent la détecte automatiquement, lit son contenu, extrait les concepts clés et les points de "
                 "contrôle, génère les questions et les quatre propositions de réponse via l'API Claude en respectant exactement le format "
                 "du QCM existant, valide la cohérence du contenu, et déploie le nouveau thème sur qcm.adamzou.fr via SSH. Les deux sites "
                 "évoluent ensemble, sans intervention manuelle. Un seul déclencheur, deux outils mis à jour.",
                 "The cheatsheets and the QCM solve two complementary problems: one to learn, one to test. In production, I'd link them in "
                 "a full agentic pipeline. When a new lesson is published on cheatsheets.adamzou.fr, an agent detects it automatically, "
                 "reads its content, extracts key concepts and checkpoints, generates the questions and four answer choices using the "
                 "Claude API, matching the exact format of the existing QCM, validates the content for consistency, and deploys the new "
                 "topic to qcm.adamzou.fr via SSH. Both sites evolve together, with no manual intervention. One trigger, two tools updated."),
    },
    {
        "slug": "peercheck", "n": "03", "title": "PeerCheck",
        "date": ("Juin 2026", "June 2026"), "iso": "2026-06", "live": "peercheck.adamzou.fr",
        "tags": ["Node.js", "Express", "SSE", "Claude API", "VPS"],
        "desc": ("Un de nos projets Holberton avait une Task 5 prévue en auto-validation, mais on aurait préféré avoir un vrai retour "
                 "structuré. J'ai construit un outil qui lit le repo GitHub et retourne un feedback IA honnête : ce qui est bien, ce qui "
                 "manque, ce qui reste à acquérir.",
                 "One of our Holberton projects had a Task 5 designed as self-validation, but a real structured review would have been "
                 "far more valuable. I built a tool that reads the GitHub repo and returns honest AI feedback: what works, what to improve, "
                 "what's missing."),
        "facts": [("900", ("tokens max par review", "max tokens per review")),
                  ("10", ("fichiers lus au maximum", "files read at most")),
                  ("3 000", ("caractères par fichier", "characters per file")),
                  ("&lt; 10 s", ("pour une review complète", "for a full review"))],
        "problem": ("Un de nos projets Holberton avait une Task 5 où les étudiants étaient censés valider leur propre travail. Mais ce "
                    "projet-là nous paraissait différent : on voulait vraiment savoir si on avait bien fait, pas juste cocher une case. On "
                    "en a parlé entre camarades et on était d'accord : un vrai retour structuré aurait été bien plus utile que "
                    "l'auto-évaluation. Mon SWE m'a entendu le dire et s'est tourné vers moi en particulier : il savait que j'avais déjà "
                    "plus de bagage sur les outils IA que le reste de la cohorte. « Adam, tu devrais faire la manual review toi-même. » "
                    "C'est cette phrase qui est devenue l'idée.",
                    "One of our Holberton projects had a Task 5 where students were supposed to validate their own work. But this "
                    "particular project felt different. We genuinely wanted to know if we'd done it right, not just tick a box. My "
                    "classmates and I talked about it and agreed: a real structured review would have been far more useful than "
                    "self-assessment. My SWE heard me say that and turned to me specifically: he knew I already had more background with "
                    "AI tools than the rest of the cohort. “Adam, you should do the manual review yourself.” That comment became the idea."),
        "approach": ("J'ai construit une API Node.js qui lit un repo GitHub via la REST API, filtre les fichiers pertinents, et stream une "
                     "review structurée en trois sections via Claude Haiku. Avant de générer quoi que ce soit, une validation en deux "
                     "niveaux vérifie si le repo correspond bien à la Task AI-IDE : d'abord un scan de mots-clés à zéro token sur le "
                     "README, puis un appel preflight Haiku qui rejette les repos sans rapport avec la task. Les repos invalides sont "
                     "bloqués avant de consommer des tokens de génération. La review stream mot par mot via SSE, pour que les étudiants "
                     "voient le retour apparaître progressivement.",
                     "I built a Node.js API that reads a GitHub repo through the REST API, filters the relevant files, and streams a "
                     "structured three-section review using Claude Haiku. Before generating anything, a two-tier validation step checks "
                     "whether the repo actually matches the AI-IDE task: first a zero-token keyword scan on the README, then a Haiku "
                     "preflight call that rejects repos unrelated to the task. This way, invalid repos are blocked before consuming any "
                     "generation tokens. The review streams word by word via SSE, so students see the output appear progressively rather "
                     "than waiting for a full response."),
        "poc": ("Une API Node.js + Express déployée sur VPS derrière Nginx. SSE streaming pour que la review apparaisse mot par mot au fur "
                "et à mesure de la génération. Validation en deux niveaux : scan de mots-clés zéro token sur le README, puis appel "
                "preflight Haiku pour confirmer que le repo correspond à la Task AI-IDE. Maximum 900 tokens pour la review, 10 fichiers "
                "lus, 3000 caractères par fichier. La review est structurée en trois sections fixes : ce qui est bien, ce qui est à "
                "améliorer, ce qui n'est pas acquis. Envoi optionnel par email via Resend. Un AbortController stoppe le stream Claude "
                "immédiatement si l'étudiant ferme le navigateur. Une review complète tourne en moins de 10 secondes.",
                "A Node.js + Express API deployed on VPS behind Nginx. SSE streaming so the review appears word by word as it generates. "
                "Two-tier validation: zero-token keyword check on the README, then a Haiku preflight call to confirm the repo matches the "
                "AI-IDE task. Max 900 tokens for the review, max 10 files read, 3000 characters per file. The review is structured in "
                "three fixed sections: what works, what to improve, what is not yet mastered. Optional email delivery via Resend. An "
                "AbortController stops the Claude stream immediately if the student closes the browser. A full review runs in under 10 seconds."),
        "learned": (("C'est la précision du périmètre qui rend le résultat fiable.",
                     "Le vrai travail, c'était de définir exactement ce que PeerCheck devait évaluer, et rien au-delà. C'est cette "
                     "contrainte qui a rendu le feedback de l'IA vraiment utilisable. Je suis rentré dans ce projet sans savoir ce "
                     "qu'était du SSE ni comment appeler une API. J'en suis sorti convaincu qu'un outil qui fait une seule chose bien "
                     "produit des résultats dont on peut se porter garant."),
                    ("Constraining the scope is what makes the output trustworthy.",
                     "The real work was defining exactly what PeerCheck should evaluate and nothing beyond that. That precision is what "
                     "made the AI feedback actually usable. I went in knowing nothing about SSE or the Claude API. I came out convinced "
                     "that a tool which does one thing well produces results you can stand behind.")),
        "prod": ("J'ajouterais un tableau de bord pour que l'enseignant puisse voir qui a soumis son repo et quand. J'éviterais de relancer "
                 "l'IA sur le même repo deux fois si rien n'a changé. Si plusieurs étudiants soumettent en même temps, j'ajouterais une file "
                 "d'attente pour ne pas cramer la limite d'API. L'objectif final, c'est que PeerCheck puisse reviewer n'importe quel repo "
                 "GitHub, pas uniquement ce projet Holberton.",
                 "I'd add a dashboard for the teacher to see who submitted and when. I'd avoid re-running the AI on the same repo twice if "
                 "nothing changed. If multiple students submit at the same time, I'd add a queue so requests don't pile up and hit the API "
                 "limit. The real end goal is to make PeerCheck work for any GitHub repo, not just this one Holberton project."),
    },
]

ABOUT = {
    "sub": ("Étudiant · Holberton School · Toulouse", "Student · Holberton School · Toulouse"),
    "p1": ("Je suis quelqu'un avec beaucoup d'idées. Trop, parfois. Des projets qui démarrent vite, des problèmes auxquels je fais face "
           "que je cherche à résoudre, et un cerveau qui switche naturellement d'un sujet à l'autre.",
           "I have a lot of ideas. Too many, sometimes. Projects that start fast, problems I face that I look to solve, and a brain "
           "that naturally switches from one subject to another."),
    "p2": ("Pendant longtemps j'ai vu ça comme un défaut. Jusqu'à ce que je comprenne que ce n'est pas de la dispersion, c'est un mode "
           "de fonctionnement. Mon cycle naturel c'est conception, construction, validation. Prouver que quelque chose est faisable, "
           "extraire ce que j'ai appris, passer à la suite.",
           "For a long time I saw that as a flaw. Until I understood that it's not scattered thinking, it's a way of operating. My "
           "natural cycle is conception, construction, validation. Prove something is doable, extract what I've learned, move on."),
    "p3": ("Ce journal est né de cette logique. Plutôt que de laisser des projets dormir sur un disque dur, j'ai commencé à les "
           "documenter : quel problème, quelle approche, qu'est-ce que ça prouve. Transformer chaque POC en quelque chose d'utile, "
           "même pour quelqu'un d'autre.",
           "This journal was born from that logic. Rather than leaving projects sleeping on a hard drive, I started documenting them: "
           "what problem, what approach, what does it prove. Turning each POC into something useful, even for someone else."),
}

AVAIL = {
    "title": ("Alternance full&#8209;stack &amp; IA agentique, dès décembre 2026",
              "Full&#8209;stack &amp; agentic AI work&#8209;study, from December 2026"),
    "text": ("En 2e année à Holberton School (Titre RNCP niveau 6). Un projet, une question sur un POC ? Je réponds généralement sous 24 h.",
             "Second year at Holberton School (RNCP Level 6). A project, a question about a POC? I usually reply within 24 hours."),
}

CV = {
    "summary": ("Développeur full-stack &amp; IA agentique, je construis des outils web et des agents IA qui résolvent des problèmes "
                "concrets. Passionné par l'automatisation et les systèmes qui fonctionnent vraiment, je cherche une alternance "
                "Développeur FullStack / IA Agentique à partir de décembre 2026, dans le cadre de ma 2e année (Titre RNCP Niveau 6).",
                "Full-stack &amp; agentic AI developer, I build web tools and AI agents that solve concrete problems. Driven by "
                "automation and systems that actually work, I'm looking for a full-stack / agentic AI developer work-study position "
                "starting December 2026, as part of my second year (RNCP Level 6)."),
    "skills": [
        ("FullStack", ["HTML5, CSS3", "Python", "REST APIs · JSON", "Git &amp; GitHub · Linux · Bash",
                       ("Nginx · VPS · Déploiement", "Nginx · VPS · Deployment"), "C"]),
        (("IA agentique", "Agentic AI"), [("Claude API · Agents multi-étapes", "Claude API · Multi-step agents"),
                                           "Prompt engineering",
                                           ("SSE · Streaming temps réel", "SSE · Real-time streaming"),
                                           "MCP (Model Context Protocol)",
                                           ("Automatisation de workflows (n8n, Make)", "Workflow automation (n8n, Make)"),
                                           ("Claude Code · Dev augmenté par l'IA", "Claude Code · AI-augmented dev")]),
    ],
    "certs": [("2026", "Open Source Foundations", "IBM · Holberton School France x IBM"),
              ("2026", "Agile Explorer", "IBM · Holberton School France x IBM")],
    "education": [
        (("Dès déc. 2026", "From Dec. 2026"), ("FullStack &amp; IA agentique (2e année, en alternance)", "FullStack &amp; agentic AI (2nd year, work-study)"),
         ("Holberton School, Toulouse · Titre RNCP Niveau 6", "Holberton School, Toulouse · RNCP Level 6"), None),
        (("Fév. 2026 → aujourd'hui", "Feb. 2026 → present"), ("Développement Web &amp; Web Mobile", "Web &amp; Mobile Web Development"),
         ("Holberton School, Toulouse · Titre RNCP Niveau 5", "Holberton School, Toulouse · RNCP Level 5"), None),
    ],
    "experience": [
        (("2026", "2026"), ("SimpleShell", "SimpleShell"), ("Projet C · Holberton School", "C project · Holberton School"),
         ("Interpréteur de commandes UNIX en C : gestion fork/execve, résolution PATH, modes interactif et non-interactif.",
          "UNIX command interpreter in C: fork/execve handling, PATH resolution, interactive and non-interactive modes.")),
        (("2026", "2026"), ("Journal de POCs", "POC Journal"), ("Projet personnel · adamzou.fr", "Personal project · adamzou.fr"),
         ("Site personnel documentant des problèmes concrets rencontrés et les solutions techniques construites pour y répondre.",
          "Personal site documenting concrete problems I ran into and the technical solutions built to address them.")),
        (("2023 → 2025", "2023 → 2025"), ("Facteur", "Postal worker"), ("La Poste", "La Poste"),
         ("Distribution en autonomie complète sur tournée : rigueur, fiabilité et gestion du temps au quotidien.",
          "Fully autonomous delivery rounds: rigor, reliability and daily time management.")),
        (("2022 → 2023", "2022 → 2023"), ("Développeur web", "Web developer"), ("Freelance", "Freelance"),
         ("Conception et maintenance de sites responsive via CMS et outils IA, livraisons itératives. Développement front-end et "
          "adaptation mobile pour des projets clients en production.",
          "Designed and maintained responsive sites with CMS and AI tools, with iterative deliveries. Front-end development and mobile "
          "adaptation for client projects in production.")),
        (("2022 → 2023", "2022 → 2023"), ("Guide en développement entrepreneurial", "Entrepreneurial development guide"), ("Mycreo", "Mycreo"),
         ("Animation de sessions d'apprentissage et conception de parcours pédagogiques.",
          "Ran learning sessions and designed learning paths.")),
    ],
    "languages": [("Français · Natif", "French · Native"), ("Anglais · B2", "English · B2")],
    "hobbies": [("Musculation", "Strength training"), ("Randonnée", "Hiking"), ("Voyages", "Travel"), ("Jeux vidéo", "Video games")],
}


def tx(v):
    """Accepte une chaîne (identique dans les deux langues) ou un couple (fr, en)."""
    return t(*v) if isinstance(v, tuple) else v


# ---------------------------------------------------------------- gabarit
def head(base, title, desc, intro=False):
    title_fr, title_en = title
    intro_js = ("try{if(!sessionStorage.getItem('az-intro-seen')||/[?&]intro=1/.test(location.search))d.classList.add('intro-running')}"
                "catch(e){d.classList.add('intro-running')}") if intro else ""
    extra = ('<link rel="preload" as="image" href="assets/hand-robot.webp">\n'
             '<link rel="preload" as="image" href="assets/hand-human.webp">\n') if intro else ""
    return f"""<!doctype html>
<html lang="fr" data-lang="fr" data-title-fr="{attr(title_fr)}" data-title-en="{attr(title_en)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title_fr}</title>
<meta name="description" content="{attr(desc)}">
<meta property="og:title" content="{attr(title_fr)}">
<meta property="og:description" content="{attr(desc)}">
<meta name="theme-color" content="#ededeb">
<link rel="icon" href="{FAVICON}">
<script>(function(d){{var l='fr';try{{var s=localStorage.getItem('az-lang');if(s==='en'||s==='fr')l=s}}catch(e){{}}d.setAttribute('data-lang',l);d.lang=l;{intro_js}}})(document.documentElement);</script>
<link rel="preload" as="image" href="{base}assets/background.webp">
{extra}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="{base}css/site.css">
</head>
"""


def header(base, current):
    def link(href, label, key):
        cur = ' aria-current="page"' if key == current else ""
        return f'<a href="{base}{href}"{cur}>{label}</a>'
    return f"""<header class="site-header">
  <div class="wrap site-header__inner">
    <a class="logo" href="{base}index.html" data-aria-fr="Adam, accueil" data-aria-en="Adam, home" aria-label="Adam, accueil">Adam.</a>
    <nav class="nav" data-aria-fr="Navigation principale" data-aria-en="Main navigation" aria-label="Navigation principale">
      {link("index.html#journal", "POCs", "pocs")}
      {link("about.html", t("À propos", "About"), "about")}
      {link("contact.html", "Contact", "contact")}
    </nav>
    <div class="lang" role="group" data-aria-fr="Langue" data-aria-en="Language" aria-label="Langue">
      <button type="button" data-set-lang="fr" aria-pressed="true" lang="fr">FR</button><button type="button" data-set-lang="en" aria-pressed="false" lang="en">EN</button>
    </div>
  </div>
</header>"""


def footer(base):
    return f"""<footer class="site-footer">
  <div class="wrap site-footer__inner">
    <p class="site-footer__sig"><a class="logo" href="{base}index.html">Adam.</a><span>{t("Journal de POCs · Toulouse", "POC Journal · Toulouse")}</span></p>
    <nav class="site-footer__links" data-aria-fr="Pied de page" data-aria-en="Footer" aria-label="Pied de page">
      <a href="{base}index.html#journal">POCs</a>
      <a href="{base}about.html">{t("À propos", "About")}</a>
      <a href="{base}contact.html">Contact</a>
      <a href="{GITHUB}" target="_blank" rel="noopener">GitHub ↗</a>
      <a href="{LINKEDIN}" target="_blank" rel="noopener">LinkedIn ↗</a>
    </nav>
    <p class="site-footer__legal">© 2026 Adam Zouaoui</p>
  </div>
</footer>"""


def page(base, name, title, desc, current, main, intro=False, static_bg=True):
    bg_cls = "grain-bg grain-bg--static" if static_bg else "grain-bg"
    intro_html = ""
    scripts = f'<script src="{base}js/site.js" defer></script>'
    if intro:
        intro_html = f"""
<div class="intro" aria-hidden="true">
  <div class="intro__name">adam.</div>
  <img class="intro__hand intro__hand--robot" src="assets/hand-robot.webp" alt="" draggable="false">
  <img class="intro__hand intro__hand--human" src="assets/hand-human.webp" alt="" draggable="false">
</div>
<canvas class="intro__light" aria-hidden="true"></canvas>
<button class="intro__skip btn btn--ghost btn--sm" type="button" hidden>{t("Passer", "Skip")}</button>"""
        scripts += '\n<script src="js/intro.js"></script>'
    return f"""{head(base, title, desc, intro)}<body class="page-{name}">
<a class="skip-link" href="#contenu">{t("Aller au contenu", "Skip to content")}</a>
<div class="{bg_cls}" aria-hidden="true"><img src="{base}assets/background.webp" alt="" draggable="false"></div>
<div class="portfolio">
{header(base, current)}
<main id="contenu">
{main}
</main>
{footer(base)}
</div>{intro_html}
{scripts}
</body>
</html>
"""


# ---------------------------------------------------------------- pages
def tags(lst):
    return '<ul class="tags">' + "".join(f"<li>{x}</li>" for x in lst) + "</ul>"


def build_index():
    newest_first = list(reversed(POCS))
    entries = []
    for p in newest_first:
        entries.append(f"""      <li class="entry panel">
        <div class="entry__meta"><span class="num">N° {p["n"]}</span><time datetime="{p["iso"]}">{t(*p["date"])}</time></div>
        <div class="entry__body">
          <h3 class="entry__title"><a href="pocs/{p["slug"]}.html">{p["title"]}</a></h3>
          {tb("p", *p["desc"], attrs='class="entry__desc"')}
          {tags(p["tags"])}
        </div>
        <div class="entry__actions">
          <a class="btn btn--solid" href="pocs/{p["slug"]}.html">{t("Voir le POC", "See the POC")} {icon("right")}</a>
          <a class="live" href="https://{p["live"]}" target="_blank" rel="noopener">{p["live"]} {icon("out", 12)}</a>
        </div>
      </li>""")
    steps = "\n".join(
        f'        <li class="step"><span class="step__n">0{i + 1}</span><h3 class="step__t">{t(*name)}</h3>'
        f'<p class="step__d">{t(*d)}</p></li>' for i, (name, d) in enumerate(STEPS))
    main = f"""<section class="hero" aria-labelledby="portfolio-title">
  <div class="wrap hero__inner">
    <p class="eyebrow">{t("Journal de POCs", "POC Journal")}<span class="sep">·</span>Adam Zouaoui</p>
    <h1 class="hero__title" id="portfolio-title" tabindex="-1">{HERO["tagline"]}</h1>
    <div class="hero__row">
      {tb("p", *HERO["desc"], attrs='class="hero__lead"')}
      <div class="actions hero__actions">
        <a class="btn btn--solid" href="#journal">{t("Voir les POCs", "See the POCs")} {icon("down")}</a>
        <a class="btn btn--ghost" href="contact.html">{t("Me contacter", "Get in touch")} {icon("right")}</a>
      </div>
    </div>
    <div class="hero__meta">
      <p class="meta-line"><span>{t(*ROLE)}</span><span>Holberton School · Toulouse</span><span class="status"><i aria-hidden="true"></i>{t("Alternance dès déc. 2026", "Work-study from Dec. 2026")}</span></p>
      <button class="replay btn btn--ghost btn--sm" type="button" hidden>{icon("replay")} {t("Rejouer l'intro", "Replay intro")}</button>
    </div>
  </div>
</section>

<section class="section" id="journal" aria-labelledby="journal-title">
  <div class="wrap">
    <div class="section-head"><h2 class="label" id="journal-title">{t("Derniers POCs", "Latest POCs")}</h2><span class="count">{len(POCS)} POCs</span></div>
    <ol class="entries">
{chr(10).join(entries)}
    </ol>
  </div>
</section>

<section class="section" aria-labelledby="method-title">
  <div class="wrap">
    <div class="section-head"><h2 class="label" id="method-title">{t("La trame d'un POC", "How each POC is written")}</h2></div>
    {tb("p", "Chaque POC est documenté de la même façon, du problème vécu jusqu'à ce que je ferais en production.",
        "Every POC is documented the same way, from the problem I ran into to what I'd do in production.", 'class="method__intro"')}
    <ol class="steps">
{steps}
    </ol>
  </div>
</section>

<section class="section" aria-labelledby="avail-title">
  <div class="wrap">
    <div class="avail panel">
      <div class="avail__body">
        <p class="badge"><i aria-hidden="true"></i>{t("Disponible", "Available")}</p>
        <h2 class="avail__title" id="avail-title">{t(*AVAIL["title"])}</h2>
      </div>
      {tb("p", *AVAIL["text"], attrs='class="avail__text"')}
      <div class="actions">
        <a class="btn btn--solid" href="mailto:{EMAIL}">{t("M'envoyer un message", "Send a message")} {icon("right")}</a>
        <a class="btn btn--ghost" href="contact.html#cv">{t("Voir le CV", "See my CV")}</a>
      </div>
    </div>
  </div>
</section>"""
    return page("", "home", ("Adam Zouaoui · Journal de POCs", "Adam Zouaoui · POC Journal"),
                "Adam Zouaoui, développeur full-stack & IA agentique à Toulouse. Les problèmes rencontrés, les solutions construites.",
                "home", main, intro=True, static_bg=False)


def build_poc(i):
    p = POCS[i]
    base = "../"
    secs = []
    contents = [p["problem"], p["approach"], p["poc"], None, p["prod"]]
    for k, ((name, _), sid) in enumerate(zip(STEPS, SEC_IDS)):
        if k == 3:
            (fr_q, fr_r), (en_q, en_r) = p["learned"]
            body = (tb("p", fr_q, en_q, 'class="lesson"') + "\n        " + tb("p", fr_r, en_r))
            cls = "poc-sec poc-sec--lesson"
        else:
            body = tb("p", *contents[k])
            cls = "poc-sec"
        secs.append(f"""      <section class="{cls}" id="{sid}" aria-labelledby="{sid}-t">
        <h2 id="{sid}-t"><span class="n">0{k + 1}</span>{t(*name)}</h2>
        {body}
      </section>""")
    toc = "\n".join(f'      <a href="#{sid}"><span>0{k + 1}</span>{t(*name)}</a>'
                    for k, ((name, _), sid) in enumerate(zip(STEPS, SEC_IDS)))
    facts = "".join(f'<div><dt>{t(*lab)}</dt><dd>{val}</dd></div>' for val, lab in p["facts"])
    prev_p = POCS[i - 1] if i > 0 else None
    next_p = POCS[i + 1] if i < len(POCS) - 1 else None
    nav = ""
    if prev_p:
        nav += (f'<a class="panel prev" href="{prev_p["slug"]}.html"><small>{icon("left", 12)} {t("POC précédent", "Previous POC")}</small>'
                f'<strong>{prev_p["title"]}</strong></a>')
    else:
        nav += (f'<a class="panel prev" href="{base}index.html#journal"><small>{icon("left", 12)} {t("Journal", "Journal")}</small>'
                f'<strong>{t("Tous les POCs", "All POCs")}</strong></a>')
    if next_p:
        nav += (f'<a class="panel next" href="{next_p["slug"]}.html"><small>{t("POC suivant", "Next POC")} {icon("right", 12)}</small>'
                f'<strong>{next_p["title"]}</strong></a>')
    else:
        nav += (f'<a class="panel next" href="{base}contact.html"><small>{t("Et maintenant", "What next")} {icon("right", 12)}</small>'
                f'<strong>{t("Travaillons ensemble", "Let’s work together")}</strong></a>')
    main = f"""<article class="poc">
  <header class="wrap poc-head">
    <a class="btn btn--ghost btn--sm" href="{base}index.html#journal">{icon("left")} {t("Journal", "Journal")}</a>
    <p class="eyebrow"><span>N° {p["n"]}</span><span class="sep">·</span><time datetime="{p["iso"]}">{t(*p["date"])}</time></p>
    <h1 class="page-head__title" id="portfolio-title">{p["title"]}</h1>
    {tb("p", *p["desc"], attrs='class="page-head__lead"')}
    {tags(p["tags"])}
    <div class="actions">
      <a class="btn btn--solid" href="https://{p["live"]}" target="_blank" rel="noopener">{t("Ouvrir", "Open")} {p["live"]} {icon("out")}</a>
    </div>
    <dl class="facts">{facts}</dl>
  </header>
  <div class="wrap poc-body">
    <nav class="toc" data-aria-fr="Sommaire" data-aria-en="Contents" aria-label="Sommaire">
{toc}
    </nav>
    <div class="poc-sections panel">
{chr(10).join(secs)}
    </div>
  </div>
  <nav class="wrap poc-nav" data-aria-fr="Autres POCs" data-aria-en="Other POCs" aria-label="Autres POCs">{nav}</nav>
</article>"""
    desc_fr = p["desc"][0].replace("&amp;", "&")
    return page(base, "poc", (f"{p['title']} · Adam Zouaoui", f"{p['title']} · Adam Zouaoui"), desc_fr, "pocs", main)


def build_about():
    cycle = (f'<li><span>Conception</span>{icon("right")}</li><li><span>Construction</span>{icon("right")}</li>'
             f'<li><span>Validation</span></li><li class="cycle__loop">{t("puis passer à la suite", "then move on")} ↺</li>')
    main = f"""<section class="wrap page-head" aria-labelledby="portfolio-title">
  <p class="eyebrow">{t("À propos", "About")}</p>
  <h1 class="page-head__title" id="portfolio-title">Adam Zouaoui</h1>
  {tb("p", *ABOUT["sub"], attrs='class="page-head__lead"')}
</section>
<section class="wrap about">
  <div class="about__text panel">
    {tb("p", *ABOUT["p1"], attrs='class="about__lead"')}
    {tb("p", *ABOUT["p2"])}
    <ol class="cycle" data-aria-fr="Mon cycle" data-aria-en="My cycle" aria-label="Mon cycle">{cycle}</ol>
    {tb("p", *ABOUT["p3"])}
  </div>
  <aside class="about__side panel">
    <dl class="kv">
      <div><dt>{t("Rôle", "Role")}</dt><dd>{t(*ROLE)}</dd></div>
      <div><dt>{t("Formation", "Education")}</dt><dd>Holberton School, Toulouse</dd></div>
      <div><dt>{t("Recherche", "Looking for")}</dt><dd>{t("Alternance à partir de décembre 2026", "Work-study from December 2026")}</dd></div>
      <div><dt>{t("Langues", "Languages")}</dt><dd>{t("Français natif · Anglais B2", "French native · English B2")}</dd></div>
    </dl>
    <div class="actions">
      <a class="btn btn--solid" href="index.html#journal">{t("Lire le journal", "Read the journal")} {icon("right")}</a>
      <a class="btn btn--ghost" href="contact.html">Contact</a>
    </div>
  </aside>
</section>"""
    return page("", "about", ("À propos · Adam Zouaoui", "About · Adam Zouaoui"),
                "Adam Zouaoui, étudiant à Holberton School Toulouse, développeur full-stack & IA agentique.", "about", main)


def build_contact():
    skills = "".join(
        f'<div><h4>{tx(name)}</h4><ul>' + "".join(f"<li>{tx(s)}</li>" for s in items) + "</ul></div>"
        for name, items in CV["skills"])
    certs = "".join(f'<li><time>{y}</time><div class="what"><strong>{n}</strong><span class="where">{w}</span></div></li>'
                    for y, n, w in CV["certs"])

    def timeline(rows):
        out = ""
        for when, what, where, detail in rows:
            d = tb("p", *detail) if detail else ""
            out += (f'<li><time>{t(*when)}</time><div class="what"><strong>{t(*what)}</strong>'
                    f'<span class="where">{t(*where)}</span>{d}</div></li>')
        return out
    langs = "".join(f"<li>{t(*x)}</li>" for x in CV["languages"])
    hobbies = "".join(f"<li>{t(*x)}</li>" for x in CV["hobbies"])
    main = f"""<section class="wrap page-head" aria-labelledby="portfolio-title">
  <p class="eyebrow">Contact</p>
  <h1 class="page-head__title" id="portfolio-title">{t("Travaillons ensemble", "Let's work together")}</h1>
  {tb("p", "Un projet en tête ? Une question sur un de mes POCs ? N'hésitez pas à m'écrire, je réponds généralement sous 24 h.",
      "Have a project in mind? A question about one of my POCs? Feel free to reach out, I usually reply within 24 hours.", 'class="page-head__lead"')}
</section>
<section class="wrap contact-grid">
  <div class="panel contact-card">
    <p class="label">E-mail</p>
    <div class="email-row">
      <a class="email" id="email" href="mailto:{EMAIL}">{EMAIL}</a>
      <button class="btn btn--ghost btn--sm" type="button" data-copy="{EMAIL}" data-copy-target="#email">
        <span class="copy-idle">{t("Copier", "Copy")}</span><span class="copy-done">{t("Copié", "Copied")} ✓</span>
      </button>
    </div>
    <ul class="link-rows">
      <li><a href="{GITHUB}" target="_blank" rel="noopener"><span><b>GitHub</b> · @Adamzou-lab</span>{icon("out")}</a></li>
      <li><a href="{LINKEDIN}" target="_blank" rel="noopener"><span><b>LinkedIn</b> · Adam Zouaoui</span>{icon("out")}</a></li>
    </ul>
  </div>
  <div class="panel avail-card">
    <p class="badge"><i aria-hidden="true"></i>{t("Disponible", "Available")}</p>
    <h2>{t("Ouvert aux opportunités", "Open to opportunities")}</h2>
    {tb("p", "Je cherche une alternance full-stack &amp; IA agentique à partir de décembre 2026. N'hésitez pas à me contacter.",
        "I'm looking for a full-stack &amp; agentic AI work-study position from December 2026. Don't hesitate to reach out.")}
    <div class="actions"><a class="btn btn--solid" href="mailto:{EMAIL}">{t("M'envoyer un message", "Send a message")} {icon("right")}</a></div>
  </div>
</section>

<section class="wrap section cv" id="cv" aria-labelledby="cv-title">
  <div class="cv__head">
    <h2 id="cv-title">Curriculum Vitae</h2>
    <a class="btn btn--solid" href="{CV_PDF}" download>{t("Télécharger en PDF", "Download as PDF")} {icon("down")}</a>
  </div>
  <div class="panel cv__sheet">
    <header class="cv__id">
      <p class="cv__name">Adam Zouaoui</p>
      <p class="cv__role">{t(*ROLE)}</p>
      <ul class="cv__contacts">
        <li><a href="tel:+33767752145">07 67 75 21 45</a></li>
        <li><a href="mailto:{EMAIL}">{EMAIL}</a></li>
        <li>Toulouse</li>
        <li><a href="{LINKEDIN}" target="_blank" rel="noopener">LinkedIn</a></li>
        <li><a href="{GITHUB}" target="_blank" rel="noopener">GitHub</a></li>
        <li><a href="index.html">adamzou.fr</a></li>
      </ul>
    </header>
    {tb("p", *CV["summary"], attrs='class="cv__summary"')}
    <div class="cv__grid">
      <div class="cv__col">
        <section class="cv__block"><h3>{t("Compétences", "Skills")}</h3><div class="skills">{skills}</div></section>
        <section class="cv__block"><h3>Certifications</h3><ul class="timeline">{certs}</ul></section>
        <section class="cv__block"><h3>{t("Langues", "Languages")}</h3><ul class="plain">{langs}</ul></section>
        <section class="cv__block"><h3>{t("Loisirs &amp; intérêts", "Hobbies &amp; interests")}</h3><ul class="plain">{hobbies}</ul></section>
      </div>
      <div class="cv__col">
        <section class="cv__block"><h3>{t("Formation", "Education")}</h3><ul class="timeline">{timeline(CV["education"])}</ul></section>
        <section class="cv__block"><h3>{t("Expérience", "Experience")}</h3><ul class="timeline">{timeline(CV["experience"])}</ul></section>
      </div>
    </div>
  </div>
</section>"""
    return page("", "contact", ("Contact · Adam Zouaoui", "Contact · Adam Zouaoui"),
                "Contacter Adam Zouaoui, développeur full-stack & IA agentique. Alternance à partir de décembre 2026.", "contact", main)


def main():
    out = {"index.html": build_index(), "about.html": build_about(), "contact.html": build_contact()}
    for i, p in enumerate(POCS):
        out[f"pocs/{p['slug']}.html"] = build_poc(i)
    for rel, html in out.items():
        path = ROOT / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(html, encoding="utf-8")
        print(f"{rel:32s} {len(html) / 1024:6.1f} Ko")


if __name__ == "__main__":
    main()

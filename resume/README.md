# applybase

A LaTeX resume system for engineers who apply to a lot of jobs.

**The idea:** instead of custom-writing a resume for every application, pre-build a handful of *category* resumes once (backend, fullstack, AI, tech lead, whatever fits your search), then pick the right category in 30 seconds when you read a JD and send the PDF. You tailor once per category, not once per application.

This repo is the scaffolding — a shared LaTeX class, one example resume, a build script that enforces single-page output, and a cover-letter framework. Everything is ~300 lines of LaTeX and ~70 lines of bash. Fork it, fill in your own content, ship.

---

## Why this exists

If you're sending more than a few applications a week, you will eventually hit one of two failure modes:

1. **You tailor every resume from scratch.** Quality stays high but your throughput caps at maybe 5 applications per week and you burn out.
2. **You send one generic resume to everyone.** Throughput is fine but the generic resume is a bad fit for roles where the JD has a specific shape (Go-heavy, Python-heavy, leadership-heavy, AI-heavy), and your response rate drops.

The category pattern solves this. Build 3–5 resumes up front, each one sharp for a specific kind of role. When a new JD lands, read it, decide which category it is, and you're done picking — 30 seconds from JD to attached PDF.

The tradeoff: you lose the last ~15% of tailoring you'd get from a fully-custom resume. For most applications that doesn't change the outcome. For the roles where it does — a stretch application to a dream company, or a weirdly-shaped role that doesn't fit any category — you do a custom pass on top of the closest category. The base is already most of the way there.

---

## Install

You need a LaTeX distribution with `pdflatex`. Optional but recommended: `pdfinfo` from poppler-utils, so the build script can enforce single-page output.

**Windows** — install [MiKTeX](https://miktex.org/) (ships with `pdflatex`). For `pdfinfo`, install [poppler for Windows](https://github.com/oschwartz10612/poppler-windows/releases) and add its `bin/` to your PATH.

**macOS** — `brew install --cask mactex-no-gui` for LaTeX, `brew install poppler` for `pdfinfo`.

**Linux** — `apt install texlive-latex-recommended texlive-fonts-extra poppler-utils` (or the equivalent for your package manager).

You don't need the full TeX Live — `texlive-latex-recommended` is enough, plus `texlive-fonts-extra` for the `tgheros` font family used by `resume.cls`.

---

## Quick start

```bash
git clone <this-repo> applybase
cd applybase
./build.sh
```

That builds `template.tex` into `template.pdf`. Open it — you'll see a single-page resume for a fictional Jane Doe at a fictional payments company. That's your starting point.

---

## Your first category

1. **Copy `template.tex`** to a new file named after the category you want, e.g. `backend.tex`:
   ```bash
   cp template.tex backend.tex
   ```
2. **Edit the header** at the top. Replace Jane Doe's name, contact row, and tagline with yours:
   ```latex
   \resumeHeader{Your Name}{%
     your.email@example.com \textbar{}
     \href{https://linkedin.com/in/you}{LinkedIn} \textbar{}
     \href{https://github.com/you}{GitHub}
   }{Your location \textbar{} Work authorization}
   ```
3. **Edit the summary** — 2-3 lines, written for the category, not for a specific job. What's the strongest version of your story for backend roles (or whatever this category is)?
4. **Edit the skills block** — categorize your stack in 4-5 labeled rows. Order matters: put the stack the category cares about first.
5. **Edit the experience** — use `\resumeSubheading{Title}{Dates}{Company --- one-line context}{Location}` and `\resumeItemListStart` / `\resumeItem{...}` / `\resumeItemListEnd`. Aim for 3-5 bullets per role, each with a concrete metric or outcome.
6. **Edit the projects** — pick the 2-4 most relevant to the category.
7. **Edit education** — trim to the essentials.
8. **Build:** `./build.sh backend`

If it comes out as 2 pages, the build script will fail loudly. Cut something — a bullet, a project, a skills row — until it fits.

### Creating more categories

Once you have one category that you're happy with, clone it:

```bash
cp backend.tex fullstack.tex
cp backend.tex ai.tex
cp backend.tex lead.tex
```

Then tune each one. Usually only the summary, the top 3 skills rows, and the ordering of bullets need to change between categories — most of the content is shared. Keep the one-page rule for every category.

`./build.sh` with no arguments builds every `.tex` file in the directory.

---

## The build script

`build.sh` does three things:

1. Runs `pdflatex` twice (needed so `hyperref` cross-references resolve)
2. Checks the output with `pdfinfo` and **fails if the PDF is more than one page**
3. Cleans up LaTeX's noisy build artifacts (`.aux`, `.log`, `.fls`, etc.)

The one-page rule is the whole point of the category pattern. If you want multi-page resumes, this system isn't for you — nothing wrong with that, it isn't the workflow applybase is designed for.

### Spacing knobs

`resume.cls` has two modes: standard (`\documentclass{resume}`) and tight (`\documentclass[tightlayout]{resume}`). The tight mode reduces section spacing and itemize padding enough to fit ~15% more content per page. Every category variant should use tight mode.

**Watch out:** the option is called `tightlayout`, not `compact`. LaTeX class options leak to every loaded package, and the `titlesec` package has its own `compact` option that collides and silently breaks section heading spacing. Don't rename it.

---

## Cover letters

Most companies don't read cover letters. For the ones that do — high-priority applications, companies where you want to signal genuine interest — see `cover-letter.md` for a minimal framework. It's a ~40-line template with placeholders, not a pre-written letter. Customize per application.

---

## Recommended workflow

For the application itself:

1. **Read the JD.** Decide which category it is. If you can't decide in 30 seconds, default to your strongest category.
2. **Attach the matching PDF.** Submit.
3. **Track it.** A plain markdown table works. Columns: Date / Company / Role / Category Used / Status / Notes. Nothing fancy needed.
4. **Only tailor further** for roles you care about — start from the closest category and make 5-10 minute edits.

For maintenance:

- Re-read your categories every 2-3 months. Any new accomplishments get added to the relevant category.
- If you notice you keep making the same 3 edits to the same category, make them permanent.
- If a category never gets used, delete it.

---

## FAQ

**Why LaTeX instead of Word / Google Docs / a website builder?**
Version control, templating, reproducible builds, fast diff review, no WYSIWYG drift. You edit text, run a command, get the same PDF every time. Tradeoff: LaTeX has a learning curve if you've never touched it.

**Why not use Markdown + Pandoc?**
You can. Pandoc's default resume templates aren't great, though, and customizing them puts you in a weird no-man's-land. LaTeX is a few hours of learning up front for a lifetime of clean output.

**What about ATS compatibility?**
`resume.cls` uses a single-column layout, standard section headings, selectable text, and no images or tables-that-are-secretly-images. Every major ATS parses the output correctly. If you want to verify, paste the PDF into [jobscan.co](https://jobscan.co) or equivalent.

**Can I use this for a non-engineering resume?**
Yes. Rename `template.tex`'s sections — "Technical Skills" becomes "Core Skills" or "Languages" or whatever fits — and fill in your own bullets. The LaTeX class doesn't care what domain you're in.

**How many categories should I have?**
3-5 is the sweet spot. Fewer than 3 and you might as well have one generic resume. More than 5 and you lose the "pick in 30 seconds" part because the decision tree gets too deep.

---

## License

MIT. See `LICENSE`. Based on [Jake's Resume](https://github.com/jakegut/resume) (also MIT).

%-------------------------
% resume.cls — applybase shared resume class
% Based on Jake's Resume template (MIT License)
%
% Usage:
%   \documentclass{resume}              % standard spacing (multi-page master docs)
%   \documentclass[tightlayout]{resume} % tight spacing for single-page variants
%
% NOTE: The option is called `tightlayout`, NOT `compact`. LaTeX global
% class options leak to every loaded package, and `titlesec` has its own
% `compact` option — naming ours the same breaks section heading spacing
% with a silent and deeply confusing failure mode.
%-------------------------

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{resume}[2026/04/07 applybase resume class]

% --- Option: tightlayout (tighter spacing to fit more content) ---
\newif\if@compact
\@compactfalse
\DeclareOption{tightlayout}{\@compacttrue}
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\ProcessOptions\relax

\LoadClass[letterpaper,11pt]{article}

% --- Packages ---
\RequirePackage[T1]{fontenc}
\RequirePackage[empty]{fullpage}
\RequirePackage{titlesec}
\RequirePackage[usenames,dvipsnames]{color}
\RequirePackage{enumitem}
\RequirePackage[hidelinks]{hyperref}
\RequirePackage{fancyhdr}
\RequirePackage[english]{babel}
\RequirePackage{tabularx}
\RequirePackage{tgheros}
\renewcommand{\familydefault}{\sfdefault}

% --- Page style ---
\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

% --- Page geometry (standard vs tightlayout) ---
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.7in}

\if@compact
  \addtolength{\textheight}{2.7in}
  \setlength{\footskip}{1pt}
\else
  \addtolength{\textheight}{2.1in}
  \setlength{\footskip}{4.5pt}
\fi

\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

% --- Spacing values (standard vs tightlayout) ---
\newlength{\subheadingafterskip}
\newlength{\projectafterskip}
\newlength{\itemlistendskip}

\if@compact
  \setlength{\subheadingafterskip}{-9pt}
  \setlength{\projectafterskip}{-9pt}
  \setlength{\itemlistendskip}{-9pt}
\else
  \setlength{\subheadingafterskip}{-7pt}
  \setlength{\projectafterskip}{-7pt}
  \setlength{\itemlistendskip}{-7pt}
\fi

% --- Section formatting (standard vs tightlayout) ---
\if@compact
  \titleformat{\section}{
    \vspace{-10pt}\scshape\raggedright\large
  }{}{0em}{}[\color{black}\titlerule \vspace{-8pt}]
\else
  \titleformat{\section}{
    \vspace{-6pt}\scshape\raggedright\large
  }{}{0em}{}[\color{black}\titlerule \vspace{-6pt}]
\fi

% --- Item and heading commands ---
\newcommand{\resumeItem}[1]{
  \item\small{
    \setlength{\parskip}{0pt}#1 \vspace{-2pt}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{\subheadingafterskip}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{\projectafterskip}
}

\renewcommand\labelitemii{\textbullet}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\if@compact
  \newcommand{\resumeItemListStart}{\begin{itemize}[itemsep=0pt,parsep=0pt,partopsep=0pt]}
\else
  \newcommand{\resumeItemListStart}{\begin{itemize}}
\fi
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{\itemlistendskip}}

% --- Summary command ---
% Usage: \resumeSummary{2-3 line professional summary text}
% Place immediately after \resumeHeader, before \section{Technical Skills}
\newcommand{\resumeSummary}[1]{
  \vspace{-4pt}
  \small #1
  \vspace{-6pt}
}

% --- Header command ---
% Usage: \resumeHeader{Your Name}{contact row}{tagline}
%
% Args:
%   #1 — your name (rendered large)
%   #2 — free-form contact row (email, phone, links — separated by \textbar{})
%   #3 — optional tagline line below contact (location, work auth, etc.)
%
% See template.tex for an example.
\newcommand{\resumeHeader}[3]{
  \begin{center}
    \textbf{\Huge \scshape #1} \\ \vspace{1pt}
    \small #2 \\
    \small #3
  \end{center}
}

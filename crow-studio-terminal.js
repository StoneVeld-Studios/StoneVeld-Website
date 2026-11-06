/* Crow's Studio: deliberately limited public studio navigator.
   This is not a shell. Never execute user-provided commands. */
(() => {
  "use strict";
  const form = document.getElementById("crow-terminal-form");
  const input = document.getElementById("crow-terminal-input");
  const output = document.getElementById("crow-terminal-output");
  if (!form || !input || !output) return;

  const commands = {
    help: {
      lines: [
        "Available commands:",
        "  about      — the studio",
        "  projects   — selected work",
        "  process    — how the work gets done",
        "  tools      — technologies and systems",
        "  contact    — get in touch",
        "  clear      — clear terminal history"
      ]
    },
    about: {
      lines: [
        "Crow's Studio / Leon at StoneVeld Studios.",
        "Practical software, systems and technical problem-solving.",
        "Principle: understand the problem before choosing the solution."
      ],
      target: "the-terminal",
      label: "Explore the studio"
    },
    projects: {
      lines: [
        "Selected work:",
        "  001  RAG Trigger Studio      public developer tool",
        "  002  StoneVeld Assistant     live on StoneVeld",
        "  003  Contingency Federation  private pilot",
        "  004  Roots Ubuntu Interface  open source"
      ],
      target: "the-workbench",
      label: "Jump to project showcase"
    },
    process: {
      lines: ["Working method: Understand → Investigate → Build → Verify."],
      target: "how-i-work",
      label: "Explore the process"
    },
    tools: {
      lines: ["Workbench: Python, Linux, JavaScript, Git, Docker, Flask, PostgreSQL and pytest."],
      target: "tools-and-systems",
      label: "See tools & systems"
    },
    contact: {
      lines: [
        "Contact Leon (Crow): leon@stoneveldstudios.co.za",
        "Initial discussions and quotations are free.",
        "Online and remote work. No on-site visits or physical repairs."
      ],
      target: "contact-crow",
      label: "Go to contact section"
    }
  };
  const aliases = { ls: "projects", workbench: "projects", "git log": "projects", method: "process", whoami: "about", email: "contact" };

  function addLine(text, klass = "crow-cli-info") {
    const line = document.createElement("p");
    line.className = "crow-cli-line " + klass;
    line.textContent = text;
    output.append(line);
  }

  function addLink(target, label) {
    const link = document.createElement("a");
    link.href = "#" + target;
    link.className = "crow-cli-jump";
    link.textContent = "↳  " + label + "  ↗";
    output.append(link);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const raw = input.value.trim().slice(0, 48);
    input.value = "";
    if (!raw) return;

    addLine("crow@studio:~$ " + raw, "crow-cli-command");
    const name = aliases[raw.toLowerCase()] || raw.toLowerCase();
    if (name === "clear") {
      output.replaceChildren();
      addLine("Terminal history cleared. Type help for commands.", "crow-cli-success");
    } else if (Object.prototype.hasOwnProperty.call(commands, name)) {
      const command = commands[name];
      command.lines.forEach(line => addLine(line, "crow-cli-success"));
      if (command.target) addLink(command.target, command.label);
    } else {
      addLine("Command not recognised. Type help for studio navigation.", "crow-cli-warning");
    }

    // Avoid retaining an unlimited transcript within this single-page demo.
    while (output.children.length > 85) output.firstElementChild.remove();
    output.scrollTop = output.scrollHeight;
    input.focus();
  });
})();

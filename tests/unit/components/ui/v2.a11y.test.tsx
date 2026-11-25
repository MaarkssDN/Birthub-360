// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../../../../src/components/ui/v2/Button.js";
import { Badge } from "../../../../src/components/ui/v2/Badge.js";
import { Input } from "../../../../src/components/ui/v2/Input.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../../../../src/components/ui/v2/Dialog.js";

describe("[34 · Ari] Componentes UI v2 — Acessibilidade WCAG 2.2 AA", () => {
  it("Button tem nome acessível, é focável e não submete formulários por padrão", () => {
    render(<Button>Salvar alterações</Button>);
    const btn = screen.getByRole("button", { name: "Salvar alterações" });
    expect(btn).toHaveAttribute("type", "button");
    btn.focus();
    expect(document.activeElement).toBe(btn);
  });

  it("Button respeita type=submit explícito para uso em formulários", () => {
    render(<Button type="submit">Enviar</Button>);
    expect(screen.getByRole("button", { name: "Enviar" })).toHaveAttribute(
      "type",
      "submit"
    );
  });

  it("Button disabled não é focável nem ativável", () => {
    render(<Button disabled>Indisponível</Button>);
    const btn = screen.getByRole("button", { name: "Indisponível" });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("disabled");
  });

  it("Input com variant=error expõe aria-invalid para leitores de tela", () => {
    render(<Input aria-label="E-mail" variant="error" />);
    expect(screen.getByLabelText("E-mail")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });

  it("Input default não tem aria-invalid", () => {
    render(<Input aria-label="Nome" />);
    expect(screen.getByLabelText("Nome")).not.toHaveAttribute("aria-invalid");
  });

  it("Badge renderiza como span (phrasing content) com texto acessível", () => {
    const { container } = render(<Badge variant="success">Ativo</Badge>);
    const badge = container.querySelector("span");
    expect(badge).not.toBeNull();
    expect(badge?.tagName).toBe("SPAN");
    expect(badge).toHaveTextContent("Ativo");
  });

  it("Dialog fecha com Escape e expõe título/descrição acessíveis", async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogTrigger>Abrir</DialogTrigger>
        <DialogContent>
          <DialogTitle>Confirmar exclusão</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(
      screen.getByRole("dialog", { name: "Confirmar exclusão" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Esta ação não pode ser desfeita.")
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

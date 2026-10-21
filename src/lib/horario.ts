export type DiaHorario = {
  abre?: string;
  fecha?: string;
  "24h"?: boolean;
  fechado?: boolean;
};

export type Horario = Record<string, DiaHorario>;

type EntradaRestaurante = {
  horario_funcionamento: Horario | null;
  status_manual: "aberto" | "fechado" | null;
  status_manual_ate: string | null;
};

const DIAS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function agoraEmSaoPaulo(data: Date) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(data);
  const pega = (tipo: string) =>
    partes.find((p) => p.type === tipo)?.value ?? "0";
  return {
    dia: DIAS[pega("weekday")] ?? 0,
    minutos: Number(pega("hour")) * 60 + Number(pega("minute")),
  };
}

function paraMinutos(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function textoDia(d?: DiaHorario) {
  if (!d || d.fechado) return "Fechado hoje";
  if (d["24h"]) return "Aberto 24h";
  if (d.abre && d.fecha) return `${d.abre} às ${d.fecha}`;
  return "Fechado hoje";
}

export function statusRestaurante(
  r: EntradaRestaurante,
  agora: Date = new Date()
) {
  const horario = r.horario_funcionamento ?? {};
  const { dia, minutos } = agoraEmSaoPaulo(agora);
  const textoHoje = textoDia(horario[String(dia)]);

  const manualValido =
    r.status_manual &&
    (!r.status_manual_ate || new Date(r.status_manual_ate) > agora);

  if (manualValido) {
    return {
      aberto: r.status_manual === "aberto",
      manual: true,
      textoHoje,
    };
  }

  let aberto = false;

  const hoje = horario[String(dia)];
  if (hoje && !hoje.fechado) {
    if (hoje["24h"]) {
      aberto = true;
    } else if (hoje.abre && hoje.fecha) {
      const abre = paraMinutos(hoje.abre);
      const fecha = paraMinutos(hoje.fecha);
      aberto = abre < fecha ? minutos >= abre && minutos < fecha : minutos >= abre;
    }
  }

  const ontem = horario[String((dia + 6) % 7)];
  if (!aberto && ontem && !ontem.fechado && ontem.abre && ontem.fecha) {
    const abre = paraMinutos(ontem.abre);
    const fecha = paraMinutos(ontem.fecha);
    if (fecha < abre && minutos < fecha) aberto = true;
  }

  return { aberto, manual: false, textoHoje };
}
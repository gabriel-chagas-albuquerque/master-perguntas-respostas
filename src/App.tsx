import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  Gamepad2,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import {
  buscarMaisPerguntas,
  iniciarTabuleiro,
  type GeneratedQuestion,
} from "./services/questionsApi";

type Question = GeneratedQuestion & { id: number };
const themes = [
  "Artes",
  "Ciência",
  "Entretenimento",
  "Esportes",
  "Geografia",
  "História",
] as const;
const themeColors: Record<string, string> = {
  Artes: "bg-[#173b63] hover:bg-[#102f50]",
  Ciência: "bg-[#8fc9e8] text-[#173b63] hover:bg-[#78b9dc]",
  Entretenimento: "bg-[#8bd39b] text-[#173b63] hover:bg-[#72c486]",
  Esportes: "bg-[#f2c84b] text-[#173b63] hover:bg-[#e2b734]",
  Geografia: "bg-[#e98c4b] hover:bg-[#d97738]",
  História: "bg-[#e78a9d] text-[#173b63] hover:bg-[#d9758b]",
};

function addQuestionsToQueue(
  currentQueue: Question[],
  newQuestions: GeneratedQuestion[],
) {
  return [
    ...currentQueue,
    ...newQuestions.map((question, index) => ({
      ...question,
      id: currentQueue.length + index + 1,
    })),
  ];
}

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [questionQueue, setQuestionQueue] = useState<Question[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const replenishingThemes = useRef(new Set<string>());

  async function startGame() {
    setIsStarting(true);

    try {
      const generatedQuestions = await iniciarTabuleiro();
      const initialQueue = addQuestionsToQueue([], generatedQuestions);
      setQuestionQueue(initialQueue);
      setAskedQuestions([]);
      setCurrentQuestion(null);
      setShowAnswer(false);
      setGameStarted(true);
      setShowWelcome(false);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Não foi possível iniciar o jogo.";
      window.alert(message);
    } finally {
      setIsStarting(false);
    }
  }

  function openQuestion(theme: string) {
    const question = questionQueue.find(({ tema }) => tema === theme);
    if (!question) {
      window.alert(`Não há mais perguntas disponíveis de ${theme}.`);
      return;
    }

    setCurrentQuestion(question);
    setShowAnswer(false);
  }

  function closeQuestion() {
    if (!currentQuestion) return;

    const remainingQuestions = questionQueue.filter(
      (question) => question !== currentQuestion,
    );
    const themeRemaining = remainingQuestions.filter(
      ({ tema }) => tema === currentQuestion.tema,
    ).length;

    const closedQuestion = currentQuestion;
    const nextAskedQuestions = [...askedQuestions, closedQuestion];

    setAskedQuestions(nextAskedQuestions);
    setQuestionQueue(remainingQuestions);
    setCurrentQuestion(null);
    setShowAnswer(false);

    if (themeRemaining <= 1 && !replenishingThemes.current.has(closedQuestion.tema)) {
      replenishingThemes.current.add(closedQuestion.tema);

      void buscarMaisPerguntas(
        closedQuestion.tema,
        nextAskedQuestions.map(({ pergunta }) => pergunta),
      )
        .then((newQuestions) => {
          setQuestionQueue((currentQueue) => addQuestionsToQueue(currentQueue, newQuestions));
        })
        .catch(() => undefined)
        .finally(() => {
          replenishingThemes.current.delete(closedQuestion.tema);
        });
    }
  }

  return (
    <main className="board-pattern relative min-h-svh overflow-hidden">
      <div className="pointer-events-none absolute -right-20 -top-20 size-56 rotate-12 rounded-[2.5rem] bg-(--master-yellow)/25 sm:size-72" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 size-72 -rotate-12 rounded-[3rem] bg-(--master-blue)/10" />

      <div className="screen-enter relative mx-auto flex min-h-svh max-w-5xl flex-col px-5 py-5 sm:px-8 sm:py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-(--master-red) text-white shadow-[4px_4px_0_#ad302b]">
              <Brain size={25} strokeWidth={2.6} />
            </div>
            <div>
              <p className="font-display text-xl leading-none text-[#233044]">
                Master
              </p>
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#697386]">
                Perguntas & diversão
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#697386] sm:flex">
            <span className="size-2 rounded-full bg-(--master-green)" /> Pronto
            para jogar?
          </div>
        </header>

        {!gameStarted ? (
          <section className="flex flex-1 flex-col items-center justify-center pb-12 pt-14 text-center sm:pt-10">
            <div className="mb-8 flex items-center gap-2" aria-hidden="true">
              {[
                "bg-[var(--master-red)]",
                "bg-[var(--master-blue)]",
                "bg-[var(--master-yellow)]",
                "bg-[var(--master-green)]",
              ].map((color) => (
                <span key={color} className={`size-3 rounded-full ${color}`} />
              ))}
            </div>
            <p className="mb-4 text-xs font-black uppercase tracking-[.3em] text-(--master-red)">
              Seu próximo desafio começa aqui
            </p>
            <h1 className="font-display max-w-3xl text-6xl leading-[.92] text-[#233044] sm:text-8xl">
              Pense rápido.
              <br />
              <span className="text-(--master-blue)">Jogue Master.</span>
            </h1>
            <p className="mt-7 max-w-md text-base font-semibold leading-relaxed text-[#697386] sm:text-lg">
              Perguntas para colocar seus conhecimentos à prova e deixar cada
              rodada ainda mais divertida.
            </p>
            <Button
              size="lg"
              className="mt-9 h-14 w-full max-w-xs rounded-2xl bg-(--master-red) px-8 text-base font-black text-white shadow-[0_6px_0_#ad302b] hover:bg-[#c9362f] hover:shadow-[0_4px_0_#ad302b] active:translate-y-1 active:shadow-none"
              onClick={() => void startGame()}
              disabled={isStarting}
            >
              <Gamepad2 size={21} /> {isStarting ? "Gerando perguntas..." : "Iniciar jogo"} <ArrowRight size={20} />
            </Button>
          </section>
        ) : (
          <section className="flex flex-1 flex-col items-center justify-center pb-12 pt-12 text-center sm:pt-10">
            <div className="mb-6 flex items-center gap-2" aria-hidden="true">
              {[
                "bg-[var(--master-red)]",
                "bg-[var(--master-blue)]",
                "bg-[var(--master-yellow)]",
                "bg-[var(--master-green)]",
              ].map((color) => (
                <span key={color} className={`size-3 rounded-full ${color}`} />
              ))}
            </div>
            <p className="mb-3 text-xs font-black uppercase tracking-[.25em] text-(--master-red)">
              Rodada de perguntas
            </p>
            <h1 className="font-display max-w-2xl text-5xl leading-[.95] text-[#233044] sm:text-7xl">
              Escolha um tema.
            </h1>
            <p className="mt-5 max-w-lg text-base font-semibold leading-relaxed text-[#697386] sm:text-lg">
              Clique em um dos temas para tirar uma pergunta.
            </p>
            <div className="mt-9 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
              {themes.map((theme) => (
                <Button
                  key={theme}
                  className={`h-16 rounded-2xl px-3 text-sm font-black shadow-[0_4px_0_rgba(35,48,68,.2)] transition-transform hover:-translate-y-0.5 active:translate-y-1 active:shadow-none ${themeColors[theme]}`}
                  onClick={() => openQuestion(theme)}
                >
                  <span>{theme}</span>
                </Button>
              ))}
            </div>
          </section>
        )}

        <footer className="flex items-center justify-center gap-2 border-t border-[#233044]/10 pt-5 text-center text-xs font-bold text-[#8a92a0]">
          <Sparkles size={14} className="text-(--master-yellow)" /> Feito para
          jogar junto
        </footer>
      </div>

      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="modal-enter w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-[1.75rem] border-0 bg-[#fffdf8] p-0 shadow-2xl">
          <div className="h-2 bg-[linear-gradient(90deg,var(--master-red)_25%,var(--master-blue)_25%_50%,var(--master-yellow)_50%_75%,var(--master-green)_75%)]" />
          <div className="p-7 sm:p-9">
            <DialogHeader className="text-left">
              <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-(--master-yellow) text-[#233044] shadow-[4px_4px_0_#d5aa27]">
                <HelpCircle size={30} strokeWidth={2.4} />
              </div>
              <DialogTitle className="font-display text-3xl text-[#233044] sm:text-4xl">
                Bem-vindo ao Master!
              </DialogTitle>
              <DialogDescription className="pt-3 text-[15px] font-semibold leading-relaxed text-[#697386]">
                Aqui você encontra perguntas prontas para animar o seu jogo de
                tabuleiro Master. Reúna a galera, escolha uma categoria e
                descubra quem sabe mais!
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 grid gap-3 text-sm font-bold text-[#233044] sm:grid-cols-3">
              {[
                ["#df3e35", "Perguntas"],
                ["#2d78b8", "Desafios"],
                ["#3c9b69", "Diversão"],
              ].map(([color, label]) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-xl bg-[#f8f3e8] px-3 py-2.5"
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </div>
              ))}
            </div>
            <Button
              className="mt-7 h-12 w-full rounded-xl bg-[#233044] font-black text-white hover:bg-[#32445e]"
              onClick={() => setShowWelcome(false)}
            >
              <Check size={19} /> Entendi, vamos jogar!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={currentQuestion !== null}
        onOpenChange={(open) => !open && closeQuestion()}
      >
        
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-[1.75rem] border-0 bg-[#fffdf8] p-0 shadow-2xl">
          {currentQuestion && (
            <>
              <div
                className={`h-2 ${themeColors[currentQuestion.tema].split(" ")[0]}`}
              />
              <div className="p-7 sm:p-9">
                <DialogHeader className="text-left">
                  <div className="flex items-center justify-between pr-8">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider text-white ${themeColors[currentQuestion.tema].split(" ")[0]}`}
                    >
                      {currentQuestion.tema}
                    </span>
                    <span className="text-xs font-bold text-[#8a92a0]">
                      Pergunta #{currentQuestion.id}
                    </span>
                  </div>
                  <DialogTitle className="pt-8 font-display text-3xl leading-tight text-[#233044] sm:text-4xl">
                    {currentQuestion.pergunta}
                  </DialogTitle>
                  <DialogDescription className="pt-3 text-sm font-semibold text-[#697386]">
                    Pense com calma antes de revelar a resposta.
                  </DialogDescription>
                </DialogHeader>
                {!showAnswer ? (
                  <Button
                    className="mt-8 h-12 w-full rounded-xl bg-[#233044] font-black text-white hover:bg-[#32445e]"
                    onClick={() => setShowAnswer(true)}
                  >
                    <HelpCircle size={19} /> Ver resposta
                  </Button>
                ) : (
                  <div className="mt-8 rounded-2xl border-2 border-dashed border-(--master-green) bg-[#effaf1] p-5 text-center">
                    <p className="text-xs font-black uppercase tracking-[.2em] text-(--master-green)">
                      Resposta
                    </p>
                    <p className="mt-2 text-xl font-black text-[#233044]">
                      {currentQuestion.resposta}
                    </p>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="mt-3 h-11 w-full rounded-xl font-black"
                  onClick={closeQuestion}
                >
                  <ArrowLeft size={17} /> Fechar pergunta
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default App;

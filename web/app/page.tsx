// TODO(ola, task 3): replace with the real home page — one big question
// "Z jakim problemem się mierzysz?" (textarea + button → /dopasuj?q=...)
// and three entry tiles: Znajdź rozwiązanie / Zgłoś pomysł / Dla instytucji.

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">
        Małopolski Hub Innowacji Społecznych
      </h1>
      <p className="max-w-prose text-lg">
        Łączymy mieszkańców, organizacje i gminy wokół innowacji społecznych.
        Budujemy tę stronę właśnie teraz — wróć za chwilę.
      </p>
    </div>
  );
}

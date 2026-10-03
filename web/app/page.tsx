import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold">
          Opisz swój problem. Znajdziemy rozwiązania, które mogą Ci pomóc.
        </h1>
        <p className="mt-3 max-w-prose">
          Nie musisz wiedzieć, jakiej pomocy szukać. Napisz własnymi słowami.
        </p>
        <form className="mt-6 max-w-2xl space-y-3" action="/dopasuj" method="get">
          <Label htmlFor="problem">Z jakim problemem się mierzysz? (wymagane)</Label>
          <Textarea
            id="problem"
            name="q"
            required
            placeholder="Na przykład: Słabo widzę. Chcę wiedzieć, z jakich innowacji mogę skorzystać."
          />
          <Button type="submit">Szukaj rozwiązań</Button>
        </form>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Trzy drogi wejścia</h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-3">
          <li>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Znajdź pomoc</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Opisz swoją sytuację. Pokażemy rozwiązania, które mogą do niej pasować.</p>
                <p className="mt-4">
                  <Link className="underline underline-offset-4" href="/dopasuj">
                    Znajdź rozwiązanie
                  </Link>
                </p>
              </CardContent>
            </Card>
          </li>
          <li>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Rozwiń swój pomysł</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Masz pomysł na pomoc? Kreator pomoże Ci go uporządkować.</p>
                <p className="mt-4">
                  <Link className="underline underline-offset-4" href="/kreator">
                    Otwórz Kreator
                  </Link>
                </p>
              </CardContent>
            </Card>
          </li>
          <li>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Wprowadź usługę w gminie</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Dopasuj sprawdzone rozwiązanie do potrzeb mieszkańców.</p>
                <p className="mt-4">
                  <Link className="underline underline-offset-4" href="/middleman">
                    Zacznij pracę
                  </Link>
                </p>
              </CardContent>
            </Card>
          </li>
        </ul>
      </section>
    </div>
  );
}

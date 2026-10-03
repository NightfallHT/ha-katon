import Link from "next/link";
import { OpenCalls } from "@/components/open-calls";
import { ResourceNav } from "@/components/resource-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calls } from "@/content/catalog";

export default function KreatorPage() {
  const openCall = calls.find((item) => item.is_open);

  return (
    <div>
      <ResourceNav current="/kreator" />
      <h1 className="text-3xl font-bold">Masz pomysł? Pomóż nam go uporządkować.</h1>
      <p className="mt-3 max-w-prose">Odpowiedz na kilka prostych pytań.</p>

      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        <li>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Zgłoś pomysł</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Opisz problem i swoje rozwiązanie w czterech krokach.</p>
              <p className="mt-4">
                <Link
                  href="/kreator/fiszka"
                  className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
                >
                  Zgłoś pomysł
                </Link>
              </p>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Podziel się dobrą praktyką
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Jeśli rozwiązanie już działa, opisz je tym samym wzorem.</p>
              <p className="mt-4">
                <Link
                  href="/kreator/dobra-praktyka"
                  className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
                >
                  Opisz dobrą praktykę
                </Link>
              </p>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Złóż wniosek o grant</CardTitle>
            </CardHeader>
            <CardContent>
              {openCall ? (
                <>
                  <p>
                    {openCall.name} jest otwarty do {openCall.deadline}.
                  </p>
                  <p className="mt-4">
                    <Link
                      href="/kreator/grant"
                      className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
                    >
                      Przygotuj wniosek
                    </Link>
                  </p>
                </>
              ) : (
                <p>Nabór jest obecnie zamknięty.</p>
              )}
            </CardContent>
          </Card>
        </li>
      </ul>
      <OpenCalls />
    </div>
  );
}

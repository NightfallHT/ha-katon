wersja: 2
id: enrich

Pracownik ROPS otwiera zgłoszenie i w kilka sekund ma wiedzieć, komu i w czym potrzebna jest pomoc. Jedno zdanie summary ma to mówić wprost. Tagi mają utrzymać rodzaj problemu: osoba niewidoma i osoba głucha to różne tagi, samotność i brak dojazdu też, jeśli oba są w tekście.

Zwróć wyłącznie JSON:
{"summary":"<jedno zdanie>","tags":["<3 do 6 krótkich tagów>"],"category":"<slug>"}

Slug, dokładnie jeden:
starzenie, zdrowie_psychiczne, samotnosc, wykluczenie_cyfrowe, dostep_do_uslug, niepelnosprawnosc, integracja_spoleczna, rodzina_dzieci, wspolpraca_miedzysektorowa, inne.

Kategorię wybierz najbliższą sprawie, ale nie zlewaj w summary różnych problemów w jedno ogólne słowo. Nie dopisuj faktów spoza tekstu.

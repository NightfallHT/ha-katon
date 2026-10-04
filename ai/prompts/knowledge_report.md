wersja: 2
id: knowledge_report

Człowiek szuka w zasobniku wiedzy odpowiedzi na swoją sprawę. Raport ma mu pomóc zrozumieć, co już może wykorzystać. Ma być po polsku, krótkimi zdaniami, bez żargonu.

Zostaw tylko innowacje i materiały, z których osoby z zapytania realnie skorzystają. Osobie niewidomej nie wstawiaj kursu dla osób głuchych. Rodzicowi, który potrzebuje przerwy w opiece, nie wstawiaj materiału o innym rodzaju problemu. Gdy nic w kontekście nie jest pomocne, napisz to w summary i nie dopychaj listy na siłę.

Korzystaj wyłącznie z podanego kontekstu. Nie wymyślaj faktów, liczb ani nazw.

Zwróć wyłącznie JSON:
{
  "title": "krótki tytuł, o sprawie z zapytania",
  "summary": "2-3 zdania: co z tego wynika dla osoby, która pyta",
  "metrics": [{"value": "liczba albo krótka wartość", "label": "co ta liczba oznacza"}],
  "what_works": ["zdanie o tym, co już pomaga w tej sprawie"],
  "innovations": [{"innovation_id": "", "title": "", "summary": ""}],
  "materials": [{"title": "", "url": "", "description": ""}]
}

Zasady:
- metrics: 2 albo 3 pozycje, tylko liczby, które da się wyczytać z kontekstu.
- what_works: 2-5 zdań o rozwiązaniach użytecznych w tej sprawie.
- innovations i materials: tylko pozycje z kontekstu, z tymi samymi id i adresami.
- Jeśli kontekst jest cienki, napisz to wprost.

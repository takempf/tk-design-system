import { useEffect, useState } from 'react';
import { Combobox, Field, Stack } from 'tk-design-system';

export const meta = {
  section: 'inputs',
  title: 'Combobox, searched',
  description:
    'Results fetched as you type. filter={null} shows them as they arrive, loading turns the field’s icon into a spinner, and status is announced. Search “storm” to see a failure.',
  order: 5.4,
};

interface Ranger {
  readonly id: string;
  readonly name: string;
  readonly post: string;
}

const rangers: Ranger[] = [
  { id: 'ada', name: 'Ada Thornbury', post: 'North ridge' },
  { id: 'bram', name: 'Bram Ashdown', post: 'River crossing' },
  { id: 'cass', name: 'Cass Fernley', post: 'Old mill' },
  { id: 'dev', name: 'Dev Holloway', post: 'Beech hanger' },
  { id: 'edie', name: 'Edie Marsh', post: 'Reed beds' },
  { id: 'finn', name: 'Finn Oakley', post: 'Fire tower' },
  { id: 'greer', name: 'Greer Hazelwood', post: 'Lower meadow' },
  { id: 'hal', name: 'Hal Brackenridge', post: 'Quarry' },
  { id: 'ines', name: 'Ines Rowe', post: 'Heron pool' },
  { id: 'jory', name: 'Jory Wychwood', post: 'Ranger station' },
];

/** A stand-in for a request: slow, and down whenever the query mentions a storm. */
function searchRangers(query: string) {
  return new Promise<Ranger[]>((resolve, reject) => {
    setTimeout(
      () => {
        const text = query.toLowerCase();
        if (text.includes('storm')) reject(new Error('The line is down. Try again later.'));
        else {
          resolve(
            rangers.filter((ranger) =>
              `${ranger.name} ${ranger.post}`.toLowerCase().includes(text),
            ),
          );
        }
      },
      300 + Math.random() * 500,
    );
  });
}

interface Search {
  readonly results: Ranger[];
  readonly error: string | null;
  readonly loading: boolean;
}

function useRangerSearch(query: string) {
  const [search, setSearch] = useState<Search>({ results: [], error: null, loading: false });
  useEffect(() => {
    const text = query.trim();
    if (!text) {
      setSearch({ results: [], error: null, loading: false });
      return;
    }
    // A slower, older answer must not land on top of a newer one.
    let current = true;
    setSearch((last) => ({ ...last, loading: true }));
    searchRangers(text).then(
      (results) => current && setSearch({ results, error: null, loading: false }),
      (error: Error) => current && setSearch({ results: [], error: error.message, loading: false }),
    );
    return () => {
      current = false;
    };
  }, [query]);
  return search;
}

const renderRanger = (ranger: Ranger) => (
  <Stack gap={1}>
    <span>{ranger.name}</span>
    <small className="pg-muted">{ranger.post}</small>
  </Stack>
);

export default function ComboboxSearch() {
  const [lead, setLead] = useState<Ranger | null>(null);
  const [leadQuery, setLeadQuery] = useState('');
  // Once chosen, the field shows the name: nothing more to look up.
  const leadSearch = useRangerSearch(leadQuery === lead?.name ? '' : leadQuery);

  const [crew, setCrew] = useState<Ranger[]>([]);
  const [crewQuery, setCrewQuery] = useState('');
  const crewSearch = useRangerSearch(crewQuery);

  const status = (search: Search) => (search.loading ? 'Searching…' : search.error);

  return (
    <Stack gap={5}>
      <Field.Root>
        <Field.Label>Lead ranger</Field.Label>
        <Combobox
          variant="input"
          multiple={false}
          items={
            lead && !leadSearch.results.includes(lead)
              ? [lead, ...leadSearch.results]
              : leadSearch.results
          }
          filter={null}
          value={lead}
          onValueChange={setLead}
          inputValue={leadQuery}
          onInputValueChange={setLeadQuery}
          itemToStringLabel={(ranger) => ranger.name}
          itemToStringValue={(ranger) => ranger.id}
          renderItem={renderRanger}
          loading={leadSearch.loading}
          status={status(leadSearch)}
          emptyMessage={leadSearch.error ? null : 'No ranger by that name.'}
          placeholder="Search by name or post…"
          clearable
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Patrol</Field.Label>
        <Combobox
          variant="input"
          items={crewSearch.results}
          filter={null}
          value={crew}
          onValueChange={setCrew}
          inputValue={crewQuery}
          onInputValueChange={setCrewQuery}
          itemToStringLabel={(ranger) => ranger.name}
          itemToStringValue={(ranger) => ranger.id}
          renderItem={renderRanger}
          loading={crewSearch.loading}
          status={status(crewSearch)}
          emptyMessage={crewSearch.error ? null : 'No ranger by that name.'}
          chipsLabel="Patrol"
          placeholder="Search by name or post…"
          selectedPlaceholder="Add a ranger…"
          clearable
        />
      </Field.Root>
    </Stack>
  );
}

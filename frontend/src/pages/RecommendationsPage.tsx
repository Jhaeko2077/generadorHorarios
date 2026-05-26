import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { endpoints, list } from "../api/academic";
import { recommendations } from "../api/schedules";
import DataTable from "../components/DataTable";

export default function RecommendationsPage() {
  const offerings = useQuery({ queryKey: ["offerings"], queryFn: () => list<any>(endpoints.offerings) });
  const terms = useQuery({ queryKey: ["terms"], queryFn: () => list<any>(endpoints.terms) });
  const [offeringId, setOfferingId] = useState("");
  const [termId, setTermId] = useState("");
  const mutation = useMutation({ mutationFn: () => recommendations(offeringId || offerings.data?.[0]?.id, { academic_term_id: termId || terms.data?.[0]?.id, limit: 5 }) });
  return (
    <div>
      <h1>Recommendations</h1>
      <div className="panel formGrid">
        <label className="field"><span>Offering</span><select value={offeringId || offerings.data?.[0]?.id || ""} onChange={(e) => setOfferingId(e.target.value)}>{offerings.data?.map((o: any) => <option key={o.id} value={o.id}>{o.id}</option>)}</select></label>
        <label className="field"><span>Term</span><select value={termId || terms.data?.[0]?.id || ""} onChange={(e) => setTermId(e.target.value)}>{terms.data?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <button onClick={() => mutation.mutate()}>Recommend time slots</button>
      </div>
      <DataTable rows={(mutation.data || []) as any[]} />
    </div>
  );
}

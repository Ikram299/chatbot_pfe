from openai import OpenAI
from app.database.supabase import supabase
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ========= EMBEDDING =========
def get_embedding(text):
    response = client.embeddings.create(
        model="text-embedding-ada-002",
        input=text
    )
    return response.data[0].embedding

# ========= MULTI-QUERY =========
def generate_multiple_queries(question):
    """Génère 3 versions différentes de la question"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": """Tu es un expert en recherche d'information. 
                Génère 3 versions différentes de la question posée pour améliorer la recherche.
                Réponds UNIQUEMENT avec les 3 questions séparées par des sauts de ligne.
                Pas de numérotation, pas d'explication."""
            },
            {
                "role": "user",
                "content": f"Question originale: {question}"
            }
        ],
        max_tokens=200
    )
    queries = response.choices[0].message.content.strip().split("\n")
    queries = [q.strip() for q in queries if q.strip()]
    return [question] + queries[:3]

# ========= HYDE =========
def generate_hypothetical_answer(question):
    """HyDE — génère une réponse hypothétique pour améliorer la recherche"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": """Tu es un expert académique. 
                Génère une réponse courte et technique à cette question 
                comme si tu avais le document sous les yeux.
                Utilise des termes techniques précis."""
            },
            {
                "role": "user",
                "content": question
            }
        ],
        max_tokens=250
    )
    return response.choices[0].message.content

# ========= RECHERCHE VECTORIELLE =========
def search_with_embedding(embedding, document_id, count=6):
    """Cherche les chunks similaires dans pgvector"""
    result = supabase.rpc("match_chunks", {
        "query_embedding": embedding,
        "document_id_filter": document_id,
        "match_count": count
    }).execute()
    return result.data or []

# ========= FUSION RRF =========
def reciprocal_rank_fusion(results_list, k=60):
    """Combine plusieurs listes de résultats avec RRF"""
    scores = {}
    contents = {}

    for results in results_list:
        for rank, item in enumerate(results):
            chunk_id = item.get("id")
            if chunk_id not in scores:
                scores[chunk_id] = 0
                contents[chunk_id] = item.get("content", "")
            scores[chunk_id] += 1 / (k + rank + 1)

    sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
    return [{"id": cid, "content": contents[cid], "score": scores[cid]} for cid in sorted_ids]

# ========= RERANKER GPT =========
def rerank_chunks(question, chunks, top_k=3):
    """Reranker — GPT choisit les chunks les plus pertinents"""
    if not chunks:
        return []

    chunks_text = "\n\n".join([
        f"[Chunk {i+1}]: {c['content'][:300]}"
        for i, c in enumerate(chunks[:8])
    ])

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": f"""Tu es un expert en recherche d'information.
                Voici une question et des passages d'un document.
                Réponds UNIQUEMENT avec les numéros des {top_k} passages 
                les plus pertinents séparés par des virgules.
                Exemple: 1,3,5"""
            },
            {
                "role": "user",
                "content": f"Question: {question}\n\nPassages:\n{chunks_text}"
            }
        ],
        max_tokens=20
    )

    try:
        indices_str = response.choices[0].message.content.strip()
        indices = [int(x.strip()) - 1 for x in indices_str.split(",")]
        selected = [chunks[i] for i in indices if 0 <= i < len(chunks)]
        return selected[:top_k]
    except:
        return chunks[:top_k]

# ========= PIPELINE RAG COMPLET =========
def advanced_rag_search(question, document_id):
    """
    Pipeline RAG Avancé :
    1. Multi-query
    2. HyDE
    3. Embeddings multiples
    4. Fusion RRF
    5. Reranker GPT
    """
    all_results = []

    # Étape 1 — Multi-query
    queries = generate_multiple_queries(question)

    # Étape 2 — HyDE
    hypothetical = generate_hypothetical_answer(question)
    queries.append(hypothetical)

    # Étape 3 — Recherche pour chaque query
    for query in queries:
        embedding = get_embedding(query)
        results = search_with_embedding(embedding, document_id, count=6)
        if results:
            all_results.append(results)

    if not all_results:
        docs = supabase.table("documents").select("text").eq("id", document_id).execute()
        if docs.data:
            return docs.data[0]["text"][:3000]
        return ""

    # Étape 4 — Fusion RRF
    fused = reciprocal_rank_fusion(all_results)

    # Étape 5 — Reranker GPT
    best_chunks = rerank_chunks(question, fused, top_k=3)

    if not best_chunks:
        return ""

    return "\n\n".join([c["content"] for c in best_chunks])
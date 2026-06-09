def validate_response(response, context):
    """
    Agent Validation — vérifie la qualité de la réponse
    """

    # Vérification 1 — réponse vide
    if not response or len(response.strip()) < 10:
        return "Je n'ai pas pu générer une réponse. Veuillez reformuler votre question."

    # Vérification 2 — contexte vide
    if not context or context == "Aucun document disponible.":
        return "Aucun document n'est disponible. Veuillez d'abord uploader un PDF."

    # Vérification 3 — réponse trop courte
    if len(response.strip()) < 20:
        return "La réponse générée est insuffisante. Veuillez reformuler votre question."

    # Vérification 4 — réponse valide
    return response
class InvalidInput(Exception):
    """Erreurs de validation issues des formulaires métier (renvoyées en 422)."""

    def __init__(self, errors):
        super().__init__("invalid input")
        self.errors = errors

    @classmethod
    def from_form(cls, form):
        return cls(
            {
                field: [e["message"] for e in errs]
                for field, errs in form.errors.get_json_data().items()
            }
        )

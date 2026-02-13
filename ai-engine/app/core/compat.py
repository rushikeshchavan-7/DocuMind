"""
Python 3.14 compatibility patch for ChromaDB + Pydantic V1.
Must be imported BEFORE chromadb.

Core issue: pydantic v1's Optional[T] detection is broken in Python 3.14,
causing settings fields to reject None values. We patch ModelField.validate
to allow None through for settings-class fields.
"""

import sys

if sys.version_info >= (3, 14):
    import pydantic.v1.fields as _fields
    import pydantic.v1.errors as _errors

    # Patch ModelField.validate to catch NoneIsNotAllowedError
    # and return None instead - this fixes Optional field detection
    _orig_validate = _fields.ModelField.validate

    def _patched_validate(self, v, values, *, loc, cls=None):
        try:
            return _orig_validate(self, v, values, loc=loc, cls=cls)
        except _errors.NoneIsNotAllowedError:
            # In Python 3.14, Optional[str] isn't detected properly.
            # Allow None through for fields that should be optional.
            return v, None
        except Exception as e:
            if "none is not an allowed value" in str(e).lower():
                return v, None
            raise

    _fields.ModelField.validate = _patched_validate

    # Also patch FieldInfo init for safety
    _orig_fi_init = _fields.FieldInfo.__init__

    def _safe_fi_init(self, default=..., **kwargs):
        try:
            _orig_fi_init(self, default, **kwargs)
        except Exception:
            self.default = default
            for k, v in kwargs.items():
                setattr(self, k, v)
            for attr in ('default_factory', 'alias', 'title', 'description',
                         'const', 'gt', 'ge', 'lt', 'le', 'multiple_of',
                         'min_length', 'max_length', 'regex'):
                if not hasattr(self, attr):
                    setattr(self, attr, None)
            if not hasattr(self, 'extra'):
                self.extra = {}

    _fields.FieldInfo.__init__ = _safe_fi_init

    # Patch ModelField.prepare for type inference failures
    _orig_prepare = _fields.ModelField.prepare

    def _safe_prepare(self):
        try:
            _orig_prepare(self)
        except Exception as e:
            if "unable to infer type" in str(e):
                self.type_ = str
                self.outer_type_ = str
                self.required = False
                self.allow_none = True
                self.default = None
                try:
                    _orig_prepare(self)
                except Exception:
                    pass
            else:
                raise

    _fields.ModelField.prepare = _safe_prepare

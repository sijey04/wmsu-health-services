# Custom MySQL backend to bypass version check for MariaDB 10.4.32
from django.db.backends.mysql import base
from django.db.backends.mysql import features


class DatabaseFeatures(features.DatabaseFeatures):
    """
    Override features for MariaDB 10.4.32 compatibility
    """
    # Disable RETURNING clause support for MariaDB 10.4.32
    can_return_columns_from_insert = False
    can_return_rows_from_bulk_insert = False
    
    # Other compatibility adjustments
    supports_over_clause = False
    supports_window_functions = False


class DatabaseWrapper(base.DatabaseWrapper):
    features_class = DatabaseFeatures
    
    def check_database_version_supported(self):
        """
        Override to bypass the MariaDB version check.
        MariaDB 10.4.32 works fine for our use case.
        """
        pass

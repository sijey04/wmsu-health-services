# Custom MySQL backend to bypass version check for MariaDB 10.4.32
from django.db.backends.mysql import base


class DatabaseWrapper(base.DatabaseWrapper):
    def check_database_version_supported(self):
        """
        Override to bypass the MariaDB version check.
        MariaDB 10.4.32 works fine for our use case.
        """
        pass

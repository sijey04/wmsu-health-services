# Django project initialization
# Configure PyMySQL for MySQL compatibility
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass
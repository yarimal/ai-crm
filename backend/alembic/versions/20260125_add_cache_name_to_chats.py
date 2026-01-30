"""add cache_name to chats

Revision ID: add_cache_name
Create Date: 2026-01-25

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_cache_name'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('chats', sa.Column('cache_name', sa.String(512), nullable=True))


def downgrade():
    op.drop_column('chats', 'cache_name')

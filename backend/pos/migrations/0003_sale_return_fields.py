from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("pos", "0002_mpesatransaction_customer_loyalty_points"),
    ]

    operations = [
        migrations.AddField(
            model_name="sale",
            name="is_return",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="sale",
            name="parent_sale",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="returns",
                to="pos.sale",
            ),
        ),
        migrations.AddIndex(
            model_name="sale",
            index=models.Index(fields=["is_return"], name="pos_sale_is_return_idx"),
        ),
    ]

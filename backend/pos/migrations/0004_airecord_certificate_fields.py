from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0003_productimage_category_description_category_icon_and_more'),
        ('pos', '0003_sale_return_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='airecord',
            name='certificate_no',
            field=models.CharField(blank=True, max_length=25, unique=True, null=True),
        ),
        migrations.AddField(
            model_name='airecord',
            name='sub_location',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='airecord',
            name='farm_ai_no',
            field=models.CharField(blank=True, max_length=50, verbose_name='Farm A.I No.'),
        ),
        migrations.AddField(
            model_name='airecord',
            name='amount_charged',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, verbose_name='Service Fee (Kshs)'),
        ),
        migrations.AddField(
            model_name='airecord',
            name='animal_name',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='airecord',
            name='animal_dob',
            field=models.DateField(blank=True, null=True, verbose_name='Animal Date of Birth'),
        ),
        migrations.AddField(
            model_name='airecord',
            name='last_calving_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='airecord',
            name='last_calving_outcome',
            field=models.CharField(
                blank=True,
                choices=[
                    ('bull', 'Bull'), ('heifer', 'Heifer'), ('twin', 'Twin'),
                    ('abortion', 'Abortion'), ('unknown', 'Unknown'),
                    ('died', 'Animal Died'), ('slaughtered', 'Slaughtered'), ('sold', 'Sold'),
                ],
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='airecord',
            name='insemination_time',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='airecord',
            name='bull_code',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='airecord',
            name='bull_name',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='airecord',
            name='second_semen_product',
            field=models.ForeignKey(
                blank=True,
                limit_choices_to={'is_ai_product': True},
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='ai_records_second',
                to='inventory.product',
            ),
        ),
        migrations.AddField(
            model_name='airecord',
            name='second_insemination_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='airecord',
            name='second_insemination_time',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='airecord',
            name='second_bull_code',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='airecord',
            name='second_bull_name',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='airecord',
            name='second_technician',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='airecord',
            name='measure',
            field=models.TextField(blank=True, verbose_name='Measurements / Observations'),
        ),
        migrations.AlterField(
            model_name='airecord',
            name='cow_id',
            field=models.CharField(max_length=50, verbose_name='Ear No.'),
        ),
    ]

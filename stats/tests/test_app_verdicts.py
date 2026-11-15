"""The app labels borderline and fragile results instead of calling them detected or absent."""

from pathlib import Path

from streamlit.testing.v1 import AppTest

APP = Path(__file__).resolve().parents[2] / "app" / "main.py"


def _open(variable, region):
    app = AppTest.from_file(str(APP), default_timeout=90).run()
    app.sidebar.selectbox[0].set_value(variable).run()
    app.sidebar.selectbox[1].set_value(region).run()
    assert not app.exception
    return app


def test_borderline_series_is_suggestive_not_confirmed():
    # Chiapas precipitation: p = 0.042 but q = 0.069.
    app = _open("precipitation_rate", "chiapas")
    assert any("Suggestive, not confirmed" in item.value for item in app.info)
    assert not any("A trend is detected" in item.value for item in app.success)


def test_significant_but_fragile_series_is_not_a_green_banner():
    # Sahel precipitation and Chiapas soil moisture lose significance when the start year moves to 2005.
    for variable, region in [("precipitation_rate", "sahel"), ("soil_moisture_0_10cm", "chiapas")]:
        app = _open(variable, region)
        assert any("sensitive to the start year" in item.value for item in app.warning)
        assert not any(item.value.startswith("A trend is detected") for item in app.success)


def test_robust_series_keeps_the_green_banner():
    app = _open("air_temperature_2m", "morelos")
    assert any(item.value.startswith("A trend is detected") for item in app.success)

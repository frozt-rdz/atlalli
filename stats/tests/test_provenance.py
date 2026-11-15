"""Provenance: line-ending independent checksums and single-dataset Giovanni URLs."""

from pipeline.ingest_giovanni import INPUT_DIR, read_giovanni_csv
from pipeline.make_series_info import single_dataset_url


def test_catalog_hash_does_not_depend_on_line_endings(tmp_path):
    content = (INPUT_DIR / "soil_chiapas.csv").read_bytes().replace(b"\r\n", b"\n")
    hashes = []
    for name, data in [("lf", content), ("crlf", content.replace(b"\n", b"\r\n"))]:
        folder = tmp_path / name
        folder.mkdir()
        (folder / "soil_chiapas.csv").write_bytes(data)
        hashes.append(read_giovanni_csv(folder / "soil_chiapas.csv")[1]["sha256"])
    assert hashes[0] == hashes[1]


def test_single_dataset_url_keeps_only_the_series_dataset():
    url = ("https://giovanni.gsfc.nasa.gov/giovanni/#service=ArAvTs&bbox=1,2,3,4"
           "&data=M2TMNXSLV_5_12_4_T2M(units%3DC)%2CGPM_3IMERGM_07_precipitation(units%3Dmm%2Fday)"
           "&dataKeyword=IMERG%20V07&portal=GIOVANNI")
    cleaned = single_dataset_url(url, "GPM_3IMERGM_07_precipitation")
    assert "data=GPM_3IMERGM_07_precipitation(units%3Dmm%2Fday)&" in cleaned
    assert "M2TMNXSLV" not in cleaned and "dataKeyword" not in cleaned

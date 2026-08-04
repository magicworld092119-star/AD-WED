import nibabel as nib
import numpy as np
from pathlib import Path

def load_nifti_image(file_path: str | Path) -> tuple[np.ndarray, np.ndarray]:
    """
    Load 3D structural MRI NIfTI scan (.nii or .nii.gz) using NiBabel.
    Returns voxel volume array and 4x4 affine matrix.
    """
    nimg = nib.load(str(file_path))
    volume = nimg.get_fdata(dtype=np.float32)
    affine = nimg.affine
    return volume, affine

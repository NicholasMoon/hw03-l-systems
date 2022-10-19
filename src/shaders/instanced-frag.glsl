#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec4 fs_Nor;
out vec4 out_Col;

const vec3 lightDir = normalize(vec3(1,1,1));

void main()
{
    vec3 color = fs_Col.xyz;
    float dot_term = dot(lightDir, normalize(fs_Nor.xyz));
    if (dot_term > 0.0f) {
        color = fs_Col.xyz * dot_term;
    }
    out_Col = vec4(color, 1.0f);
}

---
"layout": "page",
"title": "Introduction",
"permalink": true,
"use": [ { "uri": "navigation.md" } ],
"math": true
---

# 2. Constraints

## 2.0 Constraint between Two Nodes

### Constraint

Target distance $r$ and target direction $\bold e$ ...

$$r\bold e - (\bold p_2 - \bold p_1) = \bold 0$$

### Constraint Violation
$$r\bold e - (\bold p_2 - \bold p_1) = \bold\Delta$$


## 2.1 Distance preserving Constraint between Two Nodes

<figure>
  <img src="img/cstr-dist.png">
  <figcaption>Fig. 1: Distance constraint</figcaption>
</figure>

We have two nodes $\bold p_1$ and $\bold p_2$ with a constrained distance $r$ between them. That prescribed distance $r$ &ndash; supposed to be constant or a determined function of time &ndash; is assumed to be violated initially, thus needs to be corrected by a length difference $\delta$. With the unit direction vector $\bold e$ from $\bold p_1$ to $\bold p_2$ we can formulate

$$\bold p_2 - \bold p_1 ~=~ (r + \delta)\bold e\,.$$ (1)

Multiplying by $\bold e$ and resolving for the correction length value yields the constraint equation

$$\delta ~=~ (\bold p_2 - \bold p_1)\bold e - r\,.$$ (2)

Rules for positive / negative values are

$$
(\bold p_2 - \bold p_1)\bold e \quad \begin{cases}
   \ge r & then & \delta \ge 0 \\
   \lt r & then & \delta \lt 0
\end{cases}
$$

Now we need a valid method, how to create compatible node displacements from the distance correction $\delta$ given by equation (2). Reformulating equation (1) by replacing $\delta = \delta_1 + \delta_2$ leads to 

$$(\bold p_2 - \delta_2\bold e) - (\bold p_1 + \delta_1\bold e) ~=~ r \bold e\,.$$ (3)

We apply an impulse based method here, which assigns mass values to nodes and thus ensures, that base nodes &ndash; having infinite mass &ndash; doesn't displace at all and two nodes with equal mass values show equally distributed &ndash; though oppositely acting &ndash; displacements. With the constraint mass $m_C$ and the displacement distribution 

$$With\quad m_C = \dfrac{1}{\frac{1}{m_1}+\frac{1}{m_2}}\quad follows \quad\delta_1 = \frac{m_C}{m_1}\delta\quad and \quad \delta_2 = \frac{m_C}{m_2}\delta$$ (4)

we finally get the node displacements

$$\bold p_1 := \bold p_1 + \frac{m_C}{m_1}\delta\bold e\quad and \quad \bold p_2 := \bold p_2 - \frac{m_C}{m_2}\delta\bold e\,,$$ (5)

so that introducing these expressions (5) into equation (1) will satisfy that constraint with $\bold p_2 - \bold p_1 = r\bold e$.

## 2.2 Angle preserving Constraint of Vector by Two Nodes

<figure>
  <img src="img/cstr-ori-2.png">
  <figcaption>Fig. 2: Angular constraint</figcaption>
</figure>

A vector is defined from node $\bold p_1$ to node $\bold p_2$. It should be aligned to a prescribed unit direction vector $\bold e$, which is supposed to be constant or a given function of time. Assuming a violated direction constraint of the nodes' difference vector and a deviation $\delta$ othogonal to vector $\bold e$, we write

$$\bold p_2 - \bold p_1 ~=~ r\bold e + \delta\tilde{\bold e}\,.$$ (6)

The corrective offset $\delta$ &ndash; identical with the constraint equation &ndash; results from simply multiplying equation (6) by $\tilde{\bold e}$.

$$\delta ~=~ (\bold p_2 - \bold p_1)\tilde{\bold e}\,.$$ (7)

Distributing $\delta = \delta_1 + \delta_2$ to both nodes in equation (6) leads to 

$$(\bold p_2 - \delta_2\tilde{\bold e}) - (\bold p_1 + \delta_1\tilde{\bold e}) ~=~ r\bold e\,.$$ (8)

Introducing node masses again, we have $\delta_1$ and $\delta_2$ according to expressions (4), which leads to new node locations

$$\bold p_1 := \bold p_1 + \frac{m_C}{m_1}\delta\tilde{\bold e}\quad and \quad \bold p_2 := \bold p_2 - \frac{m_C}{m_2}\delta\tilde{\bold e}\,,$$ (9)

Introducing these new node locations (9) into equation (6) will finally satisfy that constraint by $\bold p_2 - \bold p_1 = r\bold e$.


## 2.3 Distance Constraint Detailed

### 2.3.1 Constraint Type `'free'`

Unconstrained distance according to equation (2) yields with $\delta=0$. Unit direction vector $\bold e$ is required to remain constant.

$$r ~=~ (\bold p_2 - \bold p_1)\bold e\,.$$ (10)








| type | $\Delta p$ | $r$ | $dr$ | $\Delta p = r$ | ref | user action | comment |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `free` | &#x2611; | &#x2611; | &#x2610; | &#x2611; | &#x2610; | &#x2610; | valid |
| `free` | &#x2611; | &#x2611; | &#x2611; | &#x2610; | &#x2610; | &#x2610; | invalid |
| `free` | &#x2611; | &#x2611; | &#x2611; | &#x2610; | &#x2611; | &#x2611; | invalidate free ref |
| `free` | &#x2611; | &#x2611; | &#x2611; | &#x2611; | &#x2611; | &#x2610; | invalidated by ref |
| `ctrl` | &#x2611; | &#x2611; | &#x2610; | &#x2611; | &#x2610; | &#x2610; | valid |
| `ctrl` | &#x2611; | &#x2611; | &#x2610; | &#x2610; | &#x2610; | &#x2610; | invalid |
| `ctrl` | &#x2611; | &#x2611; | &#x2610; | &#x2610; | &#x2611; | &#x2610; | invalidate free ref |


## 2.4 Preserving Angle between Two Node-pair Vectors

<figure>
  <img src="img/cstr-dual-ori.png">
  <figcaption>Fig. 3: Angular constraint</figcaption>
</figure>

Considering two orientational constraints with their node difference vectors $\bold c_1$ and $\bold c_2$, the given angle $\psi$ from $\bold c_1$ to $\bold c_2$ is supposed to be constant or a function of time.

$$\cos\psi = \dfrac{\bold c_1\bold c_2}{c_1 c_2} = \bold e_1\bold e_2\quad and \quad  \sin\psi = \dfrac{\tilde{\bold c}_1\bold c_2}{c_1 c_2} = \tilde{\bold e}_1\bold e_2\,.$$ (10)

This condition between two constraints is considered to be initially violated by an &ndash; to be corrected &ndash; angle $\delta$, so that

$$\cos(\psi+\delta) = \bold e_1\bold e_2\quad and \quad \sin(\psi+\delta) = \tilde{\bold e}_1\bold e_2\,.$$

Using addition theorems of trigonometry yields

$$\cos\psi\cos\delta - \sin\psi\sin\delta = \bold e_1\bold e_2\quad and \quad \sin\psi\cos\delta + \cos\psi\sin\delta = \tilde{\bold e}_1\bold e_2\,.$$

Multiplying the first equation by $\sin\psi$, the second by $\cos\psi$ and subtracting, as well as multiplying the first equation by $\cos\psi$, the second by $\sin\psi$ and adding gives

$$\sin\delta = \tilde{\bold e}_{1}\bold e_{2}\cos\psi - \bold e_{1}\bold e_{2}\sin\psi\quad and \quad \cos\delta = \tilde{\bold e}_{1}\bold e_{2}\sin\psi + \bold e_{1}\bold e_{2}\cos\psi\,.$$ (11)

Analog to expressions (4) we can split angle $\delta$ with respect to both constraints.

$$With\quad m_C = \dfrac{1}{\frac{1}{m_{C1}}+\frac{1}{m_{C2}}}\quad follows \quad\delta_1 = \frac{m_C}{m_{C1}}\delta\quad and \quad \delta_2 = \frac{m_C}{m_{C2}}\delta$$ (12)

Now in order to correct the two vectors $\bold e_{1}$ and $\bold e_{2}$, so that  the requested angle $\psi$ runs from $\bold e_{1}$ to $\bold e_{2}$, we apply a rotational transformation on each unit direction vector

$$\bold e_1 := \cos\delta_1\,\bold e_1 - \sin\delta_1\,\tilde{\bold e}_1\quad and \quad \bold e_2 := \cos\delta_2\,\bold e_2 + \sin\delta_2\,\tilde{\bold e}_2$$ (13)

This way we rotate vector $\bold e_{1}$ backward by $-\delta_1$ and vector $\bold e_{2}$ forward by $\delta_2$ .

$$\bold a_{12}^* = \cos\dfrac{\delta}{2}\bold a_{12} - \sin\dfrac{\delta}{2}\tilde{\bold a}_{12}\quad and \quad \bold a_{13}^* = \cos\dfrac{\delta}{2}\bold a_{13} + \sin\dfrac{\delta}{2}\tilde{\bold a}_{12}$$

Finally the corrected node positions can be calculated by 

$$\bold p_2 = \bold p_1 + \bold a_{12}^*\quad and \quad \bold p_3 = \bold p_1 + \bold a_{13}^*$$

while holding $\bold p_1$ in its old position. The latter is done without loss of generality.
